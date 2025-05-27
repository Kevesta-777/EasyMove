import { Button } from "@/components/ui/button";

export default function CTASection() {
  return (
    <section className="py-16 bg-primary text-white">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-6">Ready to simplify your move?</h2>
        <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
          Get started with EasyMove today and experience hassle-free moving services at competitive
          prices.
        </p>
        <Button asChild className="bg-white text-primary font-bold px-8 py-6 h-auto text-lg shadow-lg hover:bg-gray-100">
          <a href="#quote-form">Get Your Quote Now</a>
        </Button>
      </div>
    </section>
  );
}
