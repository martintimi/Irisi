import React from 'react';
import LuxuryLoader from '@/components/common/LuxuryLoader';

export default function Loading() {
  return (
    <LuxuryLoader
      fullScreen={false}
      autoHideMs={1200}
      label="Ì R Í S Í"
      sublabel="Curating Luxury Feed..."
    />
  );
}
