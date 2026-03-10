'use client';

import { useState, useMemo, useCallback, memo } from 'react';
import { Heart, Download, Share2, Eye, Tag } from 'lucide-react';
import { motion } from 'framer-motion';
import { Photo, mockPhotos } from '@/lib/mock-photo-data';

interface GalleryGridProps {
  limit?: number;
  className?: string;
  onLoadMore?: () => void;
  isLoading?: boolean;
  selectedTags?: string[];
  searchQuery?: string;
  currentPage?: number;
}

interface PhotoCardProps {
  photo: Photo;
  index: number;
  isLiked: boolean;
  onLikeToggle: (photoId: string) => void;
  onViewDetails: (photo: Photo) => void;
}

interface FilteredPhotosResult {
  displayedPhotos: Photo[];
  totalPhotos: number;
  hasMore: boolean;
}

// Extracted PhotoCard component for better performance
const PhotoCard = memo(({ photo, index, isLiked, onLikeToggle, onViewDetails }: PhotoCardProps) => {
  const gradientClass = useMemo(() => {
    const gradients = [
      'bg-gradient-to-br from-blue-400 to-blue-600',
      'bg-gradient-to-br from-green-400 to-green-600',
      'bg-gradient-to-br from-purple-400 to-purple-600',
      'bg-gradient-to-br from-pink-400 to-pink-600',
      'bg-gradient-to-br from-yellow-400 to-yellow-600',
      'bg-gradient-to-br from-red-400 to-red-600',
    ];
    return gradients[index % gradients.length];
  }, [index]);

  const handleLikeClick = useCallback(() => {
    onLikeToggle(photo.id);
  }, [photo.id, onLikeToggle]);

  const handleViewClick = useCallback(() => {
    onViewDetails(photo);
  }, [photo, onViewDetails]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="group relative card-elevated overflow-hidden"
    >
      {/* Photo Container */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <div className={`w-full h-full ${gradientClass}`} />
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300">
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button onClick={handleViewClick} className="btn-secondary">
              View Details
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={handleLikeClick}
            className={`p-2 rounded-full backdrop-blur-sm transition-colors ${
              isLiked
                ? 'bg-red-500 text-white'
                : 'bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
            }`}
            aria-label={isLiked ? 'Unlike photo' : 'Like photo'}
          >
            <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
          </button>
          <button 
            className="p-2 rounded-full bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 backdrop-blur-sm transition-colors"
            aria-label="Download photo"
          >
            <Download className="h-4 w-4" />
          </button>
          <button 
            className="p-2 rounded-full bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 backdrop-blur-sm transition-colors"
            aria-label="Share photo"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Photo Info */}
      <div className="p-4">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-2 truncate">
          {photo.title}
        </h3>
        
        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-3">
          {photo.tags.slice(0, 3).map(tag => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-full"
            >
              <Tag className="h-3 w-3" />
              {tag}
            </span>
          ))}
          {photo.tags.length > 3 && (
            <span className="text-xs text-slate-500 px-2 py-1">
              +{photo.tags.length - 3} more
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Heart className="h-4 w-4" />
              {photo.likes + (isLiked ? 1 : 0)}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {photo.views}
            </span>
            <span className="flex items-center gap-1">
              <Download className="h-4 w-4" />
              {photo.downloads}
            </span>
          </div>
        </div>

        {/* Photographer */}
        {photo.photographer && (
          <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            by {photo.photographer}
          </div>
        )}
      </div>
    </motion.div>
  );
});

PhotoCard.displayName = 'PhotoCard';

// Helper function to filter photos
const filterPhotos = (
  photos: Photo[],
  selectedTags: string[],
  searchQuery: string
): Photo[] => {
  return photos.filter(photo => {
    // Filter by tags
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.some(tag => photo.tags.includes(tag.toLowerCase()));
    
    // Filter by search query
    const matchesSearch = searchQuery === "" ||
      photo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      photo.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (photo.photographer?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    
    return matchesTags && matchesSearch;
  });
};

export function GalleryGrid({ 
  limit = 6, 
  className = "", 
  onLoadMore,
  isLoading = false,
  selectedTags = [],
  searchQuery = "",
  currentPage = 1
}: GalleryGridProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [likedPhotos, setLikedPhotos] = useState<Set<string>>(new Set());

  // Memoize filtered and paginated photos
  const { displayedPhotos, totalPhotos, hasMore } = useMemo<FilteredPhotosResult>(() => {
    const filtered = filterPhotos(mockPhotos, selectedTags, searchQuery);
    const total = filtered.length;
    const endIndex = currentPage * limit;
    const displayed = filtered.slice(0, endIndex);
    
    return {
      displayedPhotos: displayed,
      totalPhotos: total,
      hasMore: endIndex < total
    };
  }, [selectedTags, searchQuery, currentPage, limit]);

  // Memoized callbacks
  const toggleLike = useCallback((photoId: string) => {
    setLikedPhotos(prev => {
      const newLiked = new Set(prev);
      if (newLiked.has(photoId)) {
        newLiked.delete(photoId);
      } else {
        newLiked.add(photoId);
      }
      return newLiked;
    });
  }, []);

  const handleViewDetails = useCallback((photo: Photo) => {
    setSelectedPhoto(photo);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedPhoto(null);
  }, []);

  const hasNoResults = displayedPhotos.length === 0;
  const hasFiltersActive = selectedTags.length > 0 || searchQuery !== "";

  return (
    <div className={`w-full ${className}`}>
      {/* Gallery Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayedPhotos.map((photo, index) => (
          <PhotoCard
            key={photo.id}
            photo={photo}
            index={index}
            isLiked={likedPhotos.has(photo.id)}
            onLikeToggle={toggleLike}
            onViewDetails={handleViewDetails}
          />
        ))}
      </div>

      {/* Empty State */}
      {hasNoResults && (
        <div className="text-center py-16">
          <div className="bg-slate-100 dark:bg-slate-800 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Eye className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
            {hasFiltersActive ? 'No photos match your filters' : 'No photos yet'}
          </h3>
          <p className="text-slate-500 dark:text-slate-400">
            {hasFiltersActive 
              ? 'Try adjusting your search terms or selected tags' 
              : 'Upload your first photos to get started'
            }
          </p>
        </div>
      )}

      {/* Load More Button */}
      {hasMore && onLoadMore && (
        <div className="text-center mt-12">
          <button
            onClick={onLoadMore}
            disabled={isLoading}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Loading...' : 'Load More Photos'}
          </button>
          <div className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Showing {displayedPhotos.length} of {totalPhotos} photos
          </div>
        </div>
      )}

      {/* Photo Detail Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">{selectedPhoto.title}</h2>
                <button
                  onClick={handleCloseModal}
                  className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  aria-label="Close modal"
                >
                  ✕
                </button>
              </div>
              <p className="text-slate-600 dark:text-slate-400">
                Photo details and larger view would be implemented here.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
