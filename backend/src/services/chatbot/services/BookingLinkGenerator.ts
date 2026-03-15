export class BookingLinkGenerator {
  private frontendUrl: string;

  constructor() {
    this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
  }

  generate(serviceId: string, slug: string): string {
    return `${this.frontendUrl}/reservar?service=${slug}`;
  }

  generateBySlug(slug: string): string {
    return `${this.frontendUrl}/reservar?service=${slug}`;
  }

  generateFromService(service: { slug: string }): string {
    return `${this.frontendUrl}/reservar?service=${service.slug}`;
  }
}

export const bookingLinkGenerator = new BookingLinkGenerator();
