import { Button } from "@/components/ui/button";
import {
  SmallVanIcon,
  MediumVanIcon,
  LargeVanIcon,
  LutonVanIcon,
} from "@/assets/van-icons";
import { useAllVanImages } from "@/hooks/use-generated-images";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";
import type { VanSize as VanSizeType } from "@/lib/types";

interface VanSizeProps {
  id: VanSizeType;
  title: string;
  description: string;
  icon: React.ReactNode;
  loadSpace: string;
  maxLength: string;
  payload: string;
  bestFor: string;
  image: string[]; // Image URLs for slideshow
}

const vanSizes: VanSizeProps[] = [
  {
    id: "small",
    title: "Small Wheelbase Van",
    description: "Perfect for parcels and light moves.",
    icon: <SmallVanIcon />,
    loadSpace: "5.2 cubic meters",
    maxLength: "2.5 meters",
    payload: "Up to 800kg",
    bestFor: "Small deliveries",
    image: [
      "https://crimson-genetic-crane-992.mypinata.cloud/ipfs/bafybeid5hulg2qzjkinybhu3l7tylausffrpxu3d2ch3a2e2fy4uchmw2i/small/small_van_1.jpg",
      "https://crimson-genetic-crane-992.mypinata.cloud/ipfs/bafybeid5hulg2qzjkinybhu3l7tylausffrpxu3d2ch3a2e2fy4uchmw2i/small/small_van_2.jpg",
      "https://crimson-genetic-crane-992.mypinata.cloud/ipfs/bafybeid5hulg2qzjkinybhu3l7tylausffrpxu3d2ch3a2e2fy4uchmw2i/small/small_van_3.jpg",
      "https://crimson-genetic-crane-992.mypinata.cloud/ipfs/bafybeid5hulg2qzjkinybhu3l7tylausffrpxu3d2ch3a2e2fy4uchmw2i/small/small_van_4.jpg",
    ],
  },
  {
    id: "medium",
    title: "Medium Wheelbase Van",
    description: "Ideal for smaller household moves.",
    icon: <MediumVanIcon />,
    loadSpace: "7.8 cubic meters",
    maxLength: "3.0 meters",
    payload: "Up to 1,200kg",
    bestFor: "Studio flat moves",
    image: [
      "https://crimson-genetic-crane-992.mypinata.cloud/ipfs/bafybeid5hulg2qzjkinybhu3l7tylausffrpxu3d2ch3a2e2fy4uchmw2i/medium/medium_van_1.jpg",
      "https://crimson-genetic-crane-992.mypinata.cloud/ipfs/bafybeid5hulg2qzjkinybhu3l7tylausffrpxu3d2ch3a2e2fy4uchmw2i/medium/medium_van_2.jpg",
      "https://crimson-genetic-crane-992.mypinata.cloud/ipfs/bafybeid5hulg2qzjkinybhu3l7tylausffrpxu3d2ch3a2e2fy4uchmw2i/medium/medium_van_3.jpg",
      "https://crimson-genetic-crane-992.mypinata.cloud/ipfs/bafybeid5hulg2qzjkinybhu3l7tylausffrpxu3d2ch3a2e2fy4uchmw2i/medium/medium_van_4.jpg",
    ],
  },
  {
    id: "large",
    title: "Long Wheelbase Van",
    description: "Great for furniture and medium-sized loads.",
    icon: <LargeVanIcon />,
    loadSpace: "13 cubic meters",
    maxLength: "4.3 meters",
    payload: "Up to 1,500kg",
    bestFor: "1-2 bedroom flats",
    image: [
      "https://crimson-genetic-crane-992.mypinata.cloud/ipfs/bafybeid5hulg2qzjkinybhu3l7tylausffrpxu3d2ch3a2e2fy4uchmw2i/large/large_van_1.jpg",
      "https://crimson-genetic-crane-992.mypinata.cloud/ipfs/bafybeid5hulg2qzjkinybhu3l7tylausffrpxu3d2ch3a2e2fy4uchmw2i/large/large_van_2.jpg",
      "https://crimson-genetic-crane-992.mypinata.cloud/ipfs/bafybeid5hulg2qzjkinybhu3l7tylausffrpxu3d2ch3a2e2fy4uchmw2i/large/large_van_3.jpg",
      "https://crimson-genetic-crane-992.mypinata.cloud/ipfs/bafkreieeampireoox2n2q67cfirvd5rwcelocjztizavfdbnz5rno37plu",
    ],
  },
  {
    id: "luton",
    title: "Luton Van",
    description: "For large moves and full house relocations.",
    icon: <LutonVanIcon />,
    loadSpace: "18+ cubic meters",
    maxLength: "4.5 meters",
    payload: "Up to 2,000kg",
    bestFor: "2-3 bedroom houses",
    image: [
      "https://crimson-genetic-crane-992.mypinata.cloud/ipfs/bafybeid5hulg2qzjkinybhu3l7tylausffrpxu3d2ch3a2e2fy4uchmw2i/giant/giant_van_1.jpg",
      "https://crimson-genetic-crane-992.mypinata.cloud/ipfs/bafybeid5hulg2qzjkinybhu3l7tylausffrpxu3d2ch3a2e2fy4uchmw2i/giant/giant_van_2.jpg",
      "https://crimson-genetic-crane-992.mypinata.cloud/ipfs/bafybeid5hulg2qzjkinybhu3l7tylausffrpxu3d2ch3a2e2fy4uchmw2i/giant/giant_van_3.jpg",
      "https://crimson-genetic-crane-992.mypinata.cloud/ipfs/bafkreifyry5pyuc2o3d6lh5eujpickqosaeozxfdn3gbzzpitri23ftp5q",
    ],
  },
];

export default function VanSizeGuide() {
  const { images, isLoading, isError } = useAllVanImages();
  const [hoveredVan, setHoveredVan] = useState<VanSizeType | null>(null);

  return (
    <section id="size-guide" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Van Size Guide</h2>
        <p className="text-center text-gray-600 max-w-3xl mx-auto mb-12">
          Choose the right van for your needs. Our fleet ranges from small vans
          for quick deliveries to large Luton vans for full house moves.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {vanSizes.map((van) => {
            // Get generated image or use fallback
            const generatedImagePath = images[van.id as VanSizeType];
            // Use the image path directly for now, without the loading state
            const imageUrls = van.image;
            const [currentImageUrl, setCurrentImageUrl] = useState(
              imageUrls[0],
            ); // Display the first image initially
            const [imageIndex, setImageIndex] = useState(0);

            const timerRef = useState(0);

            useEffect(() => {
              const timer = setInterval(() => {
                setImageIndex(
                  (prevIndex) => (prevIndex + 1) % imageUrls.length,
                );
              }, 5000); // Change image every 5 seconds

              return () => clearInterval(timer); // Clean up the interval on unmount
            }, [imageUrls.length]);

            useEffect(() => {
              setCurrentImageUrl(imageUrls[imageIndex]);
            }, [imageIndex, imageUrls]);

            return (
              <div
                key={van.id}
                className="bg-secondary border border-primary/10 rounded-xl shadow-lg overflow-hidden transition-transform hover:scale-105"
                onMouseEnter={() => setHoveredVan(van.id)}
                onMouseLeave={() => setHoveredVan(null)}
              >
                <div className="h-48 bg-gray-200 relative bg-white">
                  {isLoading ? (
                    <div className="h-full w-full flex items-center justify-center">
                      <Skeleton className="h-full w-full" />
                    </div>
                  ) : (
                    <div
                      className="w-full h-full bg-contain bg-center transition-opacity duration-500"
                      style={{
                        backgroundImage: `url(${currentImageUrl})`,
                        backgroundRepeat: "no-repeat",
                      }}
                    ></div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent text-white p-4">
                    <h3 className="font-bold text-xl">{van.title}</h3>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-blue-600 mb-2 font-semibold">
                    {van.description}
                  </p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Load Space:</span>
                      <span className="font-medium">{van.loadSpace}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Max Length:</span>
                      <span className="font-medium">{van.maxLength}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Payload:</span>
                      <span className="font-medium">{van.payload}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Best For:</span>
                      <span className="font-medium">{van.bestFor}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <Button asChild className="bg-primary text-white font-bold px-8 py-3">
            <a href="#quote-form">Get Your Quote</a>
          </Button>
        </div>
      </div>
    </section>
  );
}
