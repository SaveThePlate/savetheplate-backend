# How to Send Test Auth Email

## Option 1: Using curl (if server is running locally)

```bash
curl -X POST http://localhost:3001/auth/send-magic-mail \
  -H "Content-Type: application/json" \
  -d '{"email":"sarrasoussia2001@gmail.com"}'
```

## Option 2: Using curl (if server is running on staging)

```bash
curl -X POST https://leftover-be.ccdev.space/auth/send-magic-mail \
  -H "Content-Type: application/json" \
  -d '{"email":"sarrasoussia2001@gmail.com"}'
```

## Option 3: Start the server first

1. Install dependencies (if not already installed):
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. In another terminal, send the email:
   ```bash
   curl -X POST http://localhost:3001/auth/send-magic-mail \
     -H "Content-Type: application/json" \
     -d '{"email":"sarrasoussia2001@gmail.com"}'
   ```

## Option 4: Using the NestJS script (after installing dependencies)

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the script:
   ```bash
   npx ts-node src/scripts/send-test-auth-email.ts
   ```

Note: In development mode, the email won't actually be sent - the magic link will be printed to the console instead.
