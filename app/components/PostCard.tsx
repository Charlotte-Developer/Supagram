import Image from "next/image";
import { getTimeAgo } from "../utils/time";
import { Post } from "../mocks/posts";

export default function PostCard({ post, onLike }: { post: Post; onLike: (id: number | string) => void }) {
  return (
    <article className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
      {/* Header con usuario y avatar */}
      <div className="flex items-center gap-3 p-4">
        <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-primary">
          <Image
            src={post.user?.avatar || "https://i.pravatar.cc/150?img=8"}
            alt={post.user?.username || "default user"}
            fill
            className="object-cover"
          />
        </div>

        <div className="flex flex-col">
          <span className="font-semibold text-foreground">
            {post.user?.username || "default user"}
          </span>
          <span className="text-xs text-foreground/50">
            {getTimeAgo(new Date(post.created_at))}
          </span>
        </div>
      </div>
    </article>
  );
}