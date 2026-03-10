import { MainSidebar } from '@/components/main-sidebar';

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainSidebar>{children}</MainSidebar>;
}
