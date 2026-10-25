import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function DashboardIndexPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role === 'ADMIN') {
    redirect('/admin/dashboard');
  } else if (session?.user?.role === 'ARTIST') {
    redirect('/artist-panel/dashboard');
  } else {
    redirect('/admin/login');
  }
}
