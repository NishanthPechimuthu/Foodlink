import React from 'react';
import {
  TomatoIcon,
  AppleIcon,
  CarrotIcon,
  BreadIcon,
  BananaIcon,
  CabbageIcon,
  MilkCartonIcon,
  BentoBoxIcon,
  OrangeIcon,
} from './FoodIcons';

export default function FoodItem({ type = 'apple', className = 'w-12 h-12', dropShadow = true }) {
  const shadowClass = dropShadow ? 'drop-shadow-lg' : '';

  switch (type) {
    case 'tomato':
      return <TomatoIcon className={`${className} ${shadowClass}`} />;
    case 'apple':
      return <AppleIcon className={`${className} ${shadowClass}`} />;
    case 'carrot':
      return <CarrotIcon className={`${className} ${shadowClass}`} />;
    case 'bread':
      return <BreadIcon className={`${className} ${shadowClass}`} />;
    case 'banana':
      return <BananaIcon className={`${className} ${shadowClass}`} />;
    case 'cabbage':
      return <CabbageIcon className={`${className} ${shadowClass}`} />;
    case 'milk':
      return <MilkCartonIcon className={`${className} ${shadowClass}`} />;
    case 'bento':
      return <BentoBoxIcon className={`${className} ${shadowClass}`} />;
    case 'orange':
      return <OrangeIcon className={`${className} ${shadowClass}`} />;
    default:
      return <AppleIcon className={`${className} ${shadowClass}`} />;
  }
}
