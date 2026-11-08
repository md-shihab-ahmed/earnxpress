import { notFound } from 'next/navigation';

export default function AdminPage() {
  // Cloaked: Public /admin route returns genuine 404 to prevent unauthorized discovery.
  // The Platform Founder accesses via the private route: /shihab-vault-7860
  notFound();
}
