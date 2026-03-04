import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Play, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface MediaItem {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string | null;
  media_type: string;
  label: string | null;
  uploaded_by: string;
}

interface MediaGalleryProps {
  inspectionId: string;
  userId: string;
  canDelete: boolean;
  refreshKey: number;
}

const MediaGallery = ({ inspectionId, userId, canDelete, refreshKey }: MediaGalleryProps) => {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMedia = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("inspection_media")
      .select("*")
      .eq("inspection_id", inspectionId)
      .order("created_at", { ascending: true });
    setMedia((data as MediaItem[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchMedia();
  }, [inspectionId, refreshKey]);

  const getSignedUrl = async (filePath: string) => {
    const { data } = await supabase.storage
      .from("inspection-media")
      .createSignedUrl(filePath, 3600);
    return data?.signedUrl || "";
  };

  const [urls, setUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadUrls = async () => {
      const newUrls: Record<string, string> = {};
      for (const m of media) {
        newUrls[m.id] = await getSignedUrl(m.file_path);
      }
      setUrls(newUrls);
    };
    if (media.length > 0) loadUrls();
  }, [media]);

  const deleteMedia = async (item: MediaItem) => {
    await supabase.storage.from("inspection-media").remove([item.file_path]);
    await supabase.from("inspection_media").delete().eq("id", item.id);
    toast.success("Media deleted");
    fetchMedia();
  };

  if (loading) return <p className="text-sm text-muted-foreground py-4">Loading media…</p>;
  if (media.length === 0) return <p className="text-sm text-muted-foreground py-4">No media uploaded yet.</p>;

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {media.map((m) => (
        <div key={m.id} className="rounded-xl border border-border overflow-hidden bg-card group relative">
          {m.media_type === "video" ? (
            <div className="aspect-video bg-muted flex items-center justify-center">
              {urls[m.id] ? (
                <video src={urls[m.id]} controls className="w-full h-full object-cover" />
              ) : (
                <Play className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
          ) : (
            <div className="aspect-video bg-muted">
              {urls[m.id] ? (
                <img src={urls[m.id]} alt={m.label || m.file_name} className="w-full h-full object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>
          )}
          <div className="p-3 flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{m.file_name}</p>
              {m.label && <Badge variant="secondary" className="mt-1 text-xs">{m.label}</Badge>}
            </div>
            {canDelete && (
              <Button variant="ghost" size="icon" className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => deleteMedia(m)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MediaGallery;
