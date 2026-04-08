import { Check, ArrowRight } from 'lucide-react';

interface RecommendationCardProps {
  planName: string;
  price: string;
  data: string;
  features: string[];
  whyThisPlan: string;
  alternativePlan?: string;
  onSelectPlan: () => void;
}

export function RecommendationCard({
  planName,
  price,
  data,
  features,
  whyThisPlan,
  alternativePlan,
  onSelectPlan,
}: RecommendationCardProps) {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100 max-w-[75%]">
      {/* Header */}
      <div className="mb-6">
        <div className="inline-block px-3 py-1 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full mb-3">
          <span className="text-xs text-purple-700">Recommended for you</span>
        </div>
        <h3 className="text-2xl mb-2 text-gray-900">{planName}</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl text-purple-600">{price}</span>
          <span className="text-gray-500">/month</span>
        </div>
      </div>

      {/* Data */}
      <div className="mb-6 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl">
        <p className="text-3xl text-gray-900">{data}</p>
        <p className="text-sm text-gray-600 mt-1">High-speed data</p>
      </div>

      {/* Features */}
      <div className="mb-6 space-y-3">
        {features.map((feature, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className="mt-0.5 w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
              <Check className="w-3 h-3 text-purple-600" />
            </div>
            <span className="text-sm text-gray-700">{feature}</span>
          </div>
        ))}
      </div>

      {/* Why This Plan */}
      <div className="mb-6 p-4 bg-gray-50 rounded-2xl">
        <p className="text-xs text-purple-600 mb-2">WHY THIS PLAN?</p>
        <p className="text-sm text-gray-700 leading-relaxed">{whyThisPlan}</p>
      </div>

      {/* Alternative */}
      {alternativePlan && (
        <div className="mb-6">
          <p className="text-xs text-gray-500 mb-2">
            Not quite right? Try{' '}
            <button className="text-purple-600 hover:underline">
              {alternativePlan}
            </button>
          </p>
        </div>
      )}

      {/* CTA */}
      <button
        onClick={onSelectPlan}
        className="w-full py-4 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-2xl hover:shadow-xl transition-all duration-200 hover:scale-[1.02] flex items-center justify-center gap-2"
      >
        <span>Select Plan</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
