'use client';

import dynamic from 'next/dynamic';

const RoamingMascot = dynamic(() => import('@/components/mascot/RoamingMascot'), {
  ssr: false,
});

export default function MascotClientMount() {
  return <RoamingMascot />;
}

