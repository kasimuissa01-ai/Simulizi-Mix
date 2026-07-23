import React from "react";
import { User, Sparkles } from "lucide-react";

interface Author {
  name: string;
  avatar: string;
  role: string;
  bgAccent: string;
}

interface AuthorsSectionProps {
  selectedAuthor: string | null;
  onSelectAuthor: (authorName: string | null) => void;
}

const AUTHORS: Author[] = [
  {
    name: "Kendrick",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250",
    role: "Msimuliaji Mkuu (Master Narrator)",
    bgAccent: "#CCE4F5"
  }
];

export const AuthorsSection: React.FC<AuthorsSectionProps> = ({
  selectedAuthor,
  onSelectAuthor
}) => {
  return (
    <div id="authors-avatar-section" className="px-6 py-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display text-xl md:text-2xl font-black text-black flex items-center gap-2">
            <User className="w-5 h-5 text-[#f43f5e]" />
            Msimuliaji Wetu
          </h3>
          <p className="text-xs text-gray-600 mt-0.5">Sauti na usimulizi halisi kutoka kwa msimuliaji wako mkuu</p>
        </div>

        {selectedAuthor && (
          <button
            onClick={() => onSelectAuthor(null)}
            className="text-[10px] font-black px-2.5 py-1 bg-white hover:bg-gray-100 border-2 border-black rounded-full neo-shadow-sm transition-all cursor-pointer"
          >
            Ondoa Filter ×
          </button>
        )}
      </div>

      {/* Authors Row */}
      <div className="flex gap-5 overflow-x-auto pb-4 pt-1 scrollbar-none -mx-6 px-6">
        {AUTHORS.map((author) => {
          const isSelected = selectedAuthor === author.name;
          return (
            <button
              key={author.name}
              onClick={() => onSelectAuthor(isSelected ? null : author.name)}
              className={`flex-shrink-0 flex items-center gap-3 p-3 rounded-2xl border-2 border-black transition-all text-left group cursor-pointer ${
                isSelected
                  ? "bg-[#CCE4F5] neo-shadow translate-x-[-1px] translate-y-[-1px]"
                  : "bg-white hover:bg-gray-50 neo-shadow-sm hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_#000000]"
              }`}
            >
              {/* Squircle Avatar inside border */}
              <div
                className="w-12 h-12 rounded-xl border-2 border-black overflow-hidden flex-shrink-0 neo-shadow-sm"
                style={{ backgroundColor: author.bgAccent }}
              >
                <img
                  src={author.avatar}
                  alt={author.name}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div>
                <h4 className="font-display font-extrabold text-xs text-black flex items-center gap-1">
                  {author.name}
                  <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" />
                </h4>
                <p className="text-[10px] text-gray-500 font-bold leading-tight mt-0.5">
                  {author.role}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
