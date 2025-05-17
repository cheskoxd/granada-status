import { Input } from './components/ui/input'
import { Button } from './components/ui/button'

interface OverlayProps {
  onSetPickup: () => void;
  onSetDropoff: () => void;
  pickupLocation: [number, number] | null;
  dropoffLocation: [number, number] | null;
}

const Overlay = ({ onSetPickup, onSetDropoff, pickupLocation, dropoffLocation }: OverlayProps) => {
  return (
    <div className='flex items-center justify-center'>
      <div className='bg-white rounded-lg shadow-lg p-4 w-full'>
        <div className='flex flex-col gap-2'>
          <div>
            Desde:
            <div className='flex gap-2'>
              <Input
                value={pickupLocation ? `${pickupLocation[0].toFixed(4)}, ${pickupLocation[1].toFixed(4)}` : ''}
                readOnly
                placeholder='Selecciona punto de recogida'
              />
              <Button onClick={onSetPickup} variant='secondary'>Seleccionar</Button>
            </div>
          </div>
          <div>
            Hasta:
            <div className='flex gap-2'>
              <Input
                value={dropoffLocation ? `${dropoffLocation[0].toFixed(4)}, ${dropoffLocation[1].toFixed(4)}` : ''}
                readOnly
                placeholder='Selecciona punto de destino'
              />
              <Button onClick={onSetDropoff} variant='secondary'>Seleccionar</Button>
            </div>
          </div>
          <Button 
            className='w-full mt-2'
            disabled={!pickupLocation || !dropoffLocation}
          >
            Pedir viaje
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Overlay