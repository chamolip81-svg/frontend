// src/components/HorizontalSection.jsx
import React, { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import SongCard from "./SongCard";

const HorizontalSection = ({ title, icon, songs }) => {
  const scrollRef = useRef(null);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: -400,
        behavior: "smooth",
      });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: 400,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="mb-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <h2 className="text-2xl font-bold">{title}</h2>
        </div>

        {/* Arrows */}
        <div className="flex gap-2">
          <button
            onClick={scrollLeft}
            className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition"
            aria-label="Scroll left"
          >
            <ChevronLeft />
          </button>

          <button
            onClick={scrollRight}
            className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition"
            aria-label="Scroll right"
          >
            <ChevronRight />
          </button>
        </div>
      </div>

      {/* Horizontal Scroll Area */}
      <div
        ref={scrollRef}
        className="
          flex gap-4
          overflow-x-auto
          scroll-smooth
          scrollbar-hide
          pb-2
        "
      >
        {songs.map((song) => (
          <div
            key={song.id}
            className="min-w-[180px] sm:min-w-[200px] lg:min-w-[220px]"
          >
            <SongCard song={song} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default HorizontalSection;
