import { Users, Plus, Eye, Edit, Trash2, Settings } from "lucide-react";
import Link from "next/link";
import { Hero, SectionContainer, SectionTitle, FeatureCard, StatsGrid, DataTable, DataTableColumn } from "@/components/ui";
import { dashboardStats, recentGalleries } from "@/lib/mock-admin-data";

// Define gallery type based on mock data structure
type Gallery = typeof recentGalleries[0];

export default function AdminPage() {
  // Define table columns
  const galleryColumns: DataTableColumn<Gallery>[] = [
    {
      key: 'name',
      header: 'Gallery Name',
      render: (gallery) => (
        <div className="font-medium text-slate-900 dark:text-white">
          {gallery.name}
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (gallery) => (
        <span className={`status-badge ${
          gallery.type === 'Client Review' ? 'status-private' :
          gallery.type === 'Public' ? 'status-active' :
          gallery.type === 'Portfolio' ? 'status-private' :
          'status-draft'
        }`}>
          {gallery.type}
        </span>
      ),
    },
    {
      key: 'photos',
      header: 'Photos',
      render: (gallery) => (
        <span className="text-slate-600 dark:text-slate-400">
          {gallery.photos}
        </span>
      ),
    },
    {
      key: 'views',
      header: 'Views',
      render: (gallery) => (
        <span className="text-slate-600 dark:text-slate-400">
          {gallery.views.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (gallery) => (
        <span className={`status-badge ${
          gallery.status === 'Active' || gallery.status === 'Published' 
            ? 'status-active'
            : 'status-draft'
        }`}>
          {gallery.status}
        </span>
      ),
    },
    {
      key: 'lastUpdated',
      header: 'Last Updated',
      render: (gallery) => (
        <span className="text-slate-600 dark:text-slate-400">
          {gallery.lastUpdated}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (gallery) => (
        <div className="flex items-center gap-2">
          <button className="btn-icon" aria-label="View gallery">
            <Eye className="h-4 w-4" />
          </button>
          <button className="btn-icon btn-icon-success" aria-label="Edit gallery">
            <Edit className="h-4 w-4" />
          </button>
          <button className="btn-icon btn-icon-danger" aria-label="Delete gallery">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="page-gradient">
      <Hero
        title="Admin Dashboard"
        description="Manage your galleries, clients, and portfolio"
      />
      
      <SectionContainer>
        {/* Stats Grid */}
        <SectionTitle title="Stats Overview" className="mb-6" />
        <StatsGrid stats={dashboardStats} />

        {/* Quick Actions */}
        <SectionTitle title="Quick Actions" />
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Link href="/upload" className="block">
            <FeatureCard 
              icon={Plus}
              title="Upload Photos"
              description="Add new photos to your galleries with automatic optimization"
              iconColor="text-blue-600"
            />
          </Link>

          <FeatureCard 
            icon={Users}
            title="Manage Clients"
            description="Add clients and manage access to private galleries"
            iconColor="text-green-600"
          />

          <FeatureCard 
            icon={Settings}
            title="Settings"
            description="Configure your portfolio, branding, and preferences"
            iconColor="text-purple-600"
          />
        </div>

        {/* Galleries Table */}
        <SectionTitle title="Recent Galleries" viewAllLink="/admin/galleries" />
        <DataTable
          data={recentGalleries}
          columns={galleryColumns}
          getRowKey={(gallery) => gallery.id}
          emptyMessage="No galleries found. Create your first gallery to get started."
        />
      </SectionContainer>
    </div>
  );
}
