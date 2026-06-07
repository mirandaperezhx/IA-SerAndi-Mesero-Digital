import React from 'react';
import SheilaChat from './SheilaChat';
import PairingCarousel from './PairingCarousel';

// Monta la mesera digital Sheila (chat abajo-derecha) + el carrusel de
// maridaje (a su izquierda). Se usa en las vistas del cliente.
export const AiAssistant: React.FC = () => (
  <>
    <PairingCarousel />
    <SheilaChat />
  </>
);

export default AiAssistant;
