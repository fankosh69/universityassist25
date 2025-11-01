import { Card } from "@/components/ui/card";

interface RegionGalleryProps {
  galleryImages?: Array<{ url: string; caption?: string }>;
}

export function RegionGallery({ galleryImages }: RegionGalleryProps) {
  if (!galleryImages || galleryImages.length === 0) return null;

  return (
    <div className="my-12">
      <h2 className="text-3xl font-bold mb-6">GALLERY</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {galleryImages.map((image, index) => (
          <Card key={index} className="overflow-hidden group cursor-pointer">
            <div className="relative aspect-video">
              <img
                src={image.url}
                alt={image.caption || `Gallery image ${index + 1}`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {image.caption && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                  <p className="text-white p-4 text-sm">{image.caption}</p>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
