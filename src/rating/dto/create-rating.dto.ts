export class CreateRatingDto {
  orderId: number;
  providerId: number;
  rating: number;
  tags?: string[];
  comment?: string;
}

