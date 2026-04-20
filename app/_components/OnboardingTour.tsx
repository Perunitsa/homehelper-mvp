"use client";

import { useState, useEffect } from "react";
import { X, ChevronRight, ChevronLeft, Home, ShoppingBasket, ClipboardList, BarChart3, CheckCircle2 } from "lucide-react";

type Step = {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
};

const STEPS: Step[] = [
  {
    title: "Добро пожаловать в HomeHelper!",
    description: "Ваш уютный помощник для управления домашним хозяйством. Давайте вкратце разберемся, как здесь всё устроено.",
    icon: <Home className="w-12 h-12" />,
    color: "bg-olive",
  },
  {
    title: "Инвентарь и Покупки",
    description: "Следите за сроками годности продуктов в 'Inventory'. Добавляйте нужные товары в 'Shopping List', чтобы ничего не забыть.",
    icon: <ShoppingBasket className="w-12 h-12" />,
    color: "bg-gold-soft",
  },
  {
    title: "Квесты и Задания",
    description: "Назначайте домашние дела на 'Quest Board'. За каждое выполнение начисляются очки опыта (XP). Родители подтверждают — дети растут в уровнях!",
    icon: <ClipboardList className="w-12 h-12" />,
    color: "bg-brown-light",
  },
  {
    title: "Статистика и Награды",
    description: "Смотрите, кто самый продуктивный в семье на странице 'Stats'. Зарабатывайте редкие бейджи и соревнуйтесь в лидерборде.",
    icon: <BarChart3 className="w-12 h-12" />,
    color: "bg-mint",
  },
  {
    title: "Всё готово!",
    description: "Вы великолепны. Теперь ваш дом под контролем. Если захотите пересмотреть это обучение, кнопка есть в вашем профиле.",
    icon: <CheckCircle2 className="w-12 h-12" />,
    color: "bg-olive-dark",
  },
];

type OnboardingTourProps = {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
};

export default function OnboardingTour({ isOpen, onClose, onComplete }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  if (!isOpen) return null;

  const step = STEPS[currentStep];
  const isLast = currentStep === STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      onComplete?.();
      onClose();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity duration-300">
      <div className="bg-cream w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header with color */}
        <div className={`h-40 flex items-center justify-center transition-colors duration-500 ${step.color}`}>
          <div className="bg-white/20 p-6 rounded-full text-white backdrop-blur-md shadow-inner">
            {step.icon}
          </div>
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/10 text-white hover:bg-black/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 text-center">
          <h2 className="heading-handwritten text-3xl text-brown mb-4">
            {step.title}
          </h2>
          <p className="text-text-secondary leading-relaxed mb-8 h-20 overflow-y-auto">
            {step.description}
          </p>

          {/* Pagination dots */}
          <div className="flex justify-center gap-2 mb-8">
            {STEPS.map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentStep ? "w-6 bg-brown" : "w-1.5 bg-beige-dark"
                }`}
              />
            ))}
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="p-3 rounded-2xl text-text-muted hover:bg-beige/30 transition-colors disabled:opacity-0"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            
            <button
              onClick={handleNext}
              className="btn-cozy px-8 py-3 flex-1 shadow-lg shadow-olive/20"
            >
              {isLast ? "Поехали!" : "Далее"}
            </button>

            <div className="w-12" /> {/* Spacer for symmetry if prev is hidden */}
          </div>
        </div>
      </div>
    </div>
  );
}
