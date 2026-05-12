"use client";

export function ReadingProgress() {
  return (
    <>
      <div className="blog-reading-progress fixed left-0 top-0 z-[60] h-[2px] w-full origin-left scale-x-0 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500" />
      <style jsx global>{`
        @keyframes blog-reading-progress {
          from {
            transform: scaleX(0);
          }
          to {
            transform: scaleX(1);
          }
        }

        .blog-reading-progress {
          animation: blog-reading-progress linear both;
          animation-timeline: scroll(root block);
        }
      `}</style>
    </>
  );
}
