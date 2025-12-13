import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

/**
 * Script to identify orphaned image files in /store directory
 * that are not referenced in the database
 */
async function checkOrphanedImages() {
  const storeDir = path.join(__dirname, '..', 'store');
  const profileImagesDir = path.join(storeDir, 'profile-images');

  // Get all files in store directory (excluding profile-images subdirectory)
  const storeFiles = fs
    .readdirSync(storeDir)
    .filter((file) => {
      const filePath = path.join(storeDir, file);
      return fs.statSync(filePath).isFile();
    })
    .map((file) => ({
      filename: file,
      fullPath: path.join(storeDir, file),
    }));

  // Get all profile image files
  let profileImageFiles: { filename: string; fullPath: string }[] = [];
  if (fs.existsSync(profileImagesDir)) {
    profileImageFiles = fs
      .readdirSync(profileImagesDir)
      .filter((file) => {
        const filePath = path.join(profileImagesDir, file);
        return fs.statSync(filePath).isFile();
      })
      .map((file) => ({
        filename: file,
        fullPath: path.join(profileImagesDir, file),
      }));
  }

  console.log(`\n📁 Found ${storeFiles.length} files in /store`);
  console.log(`📁 Found ${profileImageFiles.length} files in /store/profile-images`);

  // Get all referenced filenames from database
  const referencedFilenames = new Set<string>();

  // Check Offer.images (JSON field)
  const offers = await prisma.offer.findMany({
    select: { images: true },
  });

  offers.forEach((offer) => {
    if (offer.images && typeof offer.images === 'object') {
      const images = Array.isArray(offer.images) ? offer.images : [offer.images];
      images.forEach((img: any) => {
        if (img?.filename) {
          referencedFilenames.add(img.filename);
        }
        // Also check path field which might contain filename
        if (img?.path) {
          const pathParts = img.path.split('/');
          const filename = pathParts[pathParts.length - 1];
          if (filename) referencedFilenames.add(filename);
        }
      });
    }
  });

  // Check User.profileImage
  const users = await prisma.user.findMany({
    select: { profileImage: true },
    where: { profileImage: { not: null } },
  });

  users.forEach((user) => {
    if (user.profileImage) {
      // profileImage might be stored as full path like "/store/profile-images/filename.jpg"
      // or just the filename
      const pathParts = user.profileImage.split('/');
      const filename = pathParts[pathParts.length - 1];
      if (filename) referencedFilenames.add(filename);
    }
  });

  console.log(`\n✅ Found ${referencedFilenames.size} referenced filenames in database`);

  // Find orphaned files
  const orphanedStoreFiles = storeFiles.filter(
    (file) => !referencedFilenames.has(file.filename),
  );

  const orphanedProfileFiles = profileImageFiles.filter(
    (file) => !referencedFilenames.has(file.filename),
  );

  // Special files that might be defaults/placeholders
  const specialFiles = ['largesurprisebag.png', 'mediumsurprisebag.png', 'smallsurprisebag.png'];
  const orphanedSpecial = orphanedStoreFiles.filter((file) =>
    specialFiles.includes(file.filename),
  );
  const orphanedRegular = orphanedStoreFiles.filter(
    (file) => !specialFiles.includes(file.filename),
  );

  console.log(`\n📊 Results:`);
  console.log(`   - Orphaned regular files: ${orphanedRegular.length}`);
  console.log(`   - Orphaned profile images: ${orphanedProfileFiles.length}`);
  console.log(`   - Special files (surprise bags): ${orphanedSpecial.length}`);

  if (orphanedRegular.length > 0) {
    console.log(`\n🗑️  Orphaned regular files (not in database):`);
    orphanedRegular.forEach((file) => {
      const stats = fs.statSync(file.fullPath);
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      console.log(`   - ${file.filename} (${sizeMB} MB)`);
    });
  }

  if (orphanedProfileFiles.length > 0) {
    console.log(`\n🗑️  Orphaned profile images (not in database):`);
    orphanedProfileFiles.forEach((file) => {
      const stats = fs.statSync(file.fullPath);
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      console.log(`   - profile-images/${file.filename} (${sizeMB} MB)`);
    });
  }

  if (orphanedSpecial.length > 0) {
    console.log(`\n⚠️  Special files (might be defaults/placeholders):`);
    orphanedSpecial.forEach((file) => {
      const stats = fs.statSync(file.fullPath);
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      console.log(`   - ${file.filename} (${sizeMB} MB)`);
    });
  }

  const totalOrphaned = orphanedRegular.length + orphanedProfileFiles.length;
  const totalSize = [
    ...orphanedRegular,
    ...orphanedProfileFiles,
  ].reduce((sum, file) => sum + fs.statSync(file.fullPath).size, 0);
  const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);

  console.log(`\n💾 Total orphaned size: ${totalSizeMB} MB`);

  if (totalOrphaned > 0) {
    console.log(`\n💡 Recommendation:`);
    console.log(`   You can safely delete ${totalOrphaned} orphaned files to free up ${totalSizeMB} MB`);
    console.log(`   Run with --delete flag to automatically delete them (use with caution!)`);
  } else {
    console.log(`\n✅ All files are referenced in the database!`);
  }

  // If --delete flag is passed, delete orphaned files
  if (process.argv.includes('--delete')) {
    console.log(`\n🗑️  Deleting orphaned files...`);
    let deleted = 0;
    for (const file of [...orphanedRegular, ...orphanedProfileFiles]) {
      try {
        fs.unlinkSync(file.fullPath);
        deleted++;
        console.log(`   ✓ Deleted: ${file.filename}`);
      } catch (error) {
        console.error(`   ✗ Failed to delete ${file.filename}:`, error);
      }
    }
    console.log(`\n✅ Deleted ${deleted} files`);
  }

  await prisma.$disconnect();
}

checkOrphanedImages().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});

