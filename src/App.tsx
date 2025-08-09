import  { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { io } from 'socket.io-client';

const userId = localStorage.getItem('userId') || crypto.randomUUID();
localStorage.setItem('userId', userId);

const socket = io(import.meta.env.VITE_SERVER_ENDPOINT, { query: { userId } });

const DraggableMarker = ({ position, onPositionChange }: { position: [number, number], onPositionChange: (pos: [number, number]) => void }) => {
  const [draggable, _] = useState(true);
  const [markerPosition, setMarkerPosition] = useState<L.LatLng>(L.latLng(position[0], position[1]));

  const eventHandlers = {
    dragend() {
      const marker = markerRef.current;
      if (marker != null) {
        const latLng = marker.getLatLng();
        setMarkerPosition(latLng);
        onPositionChange([latLng.lat, latLng.lng]);
      }
    },
  };

  const markerRef = useRef<L.Marker>(null);

  return (
    <Marker
      draggable={draggable}
      eventHandlers={eventHandlers}
      position={markerPosition}
      ref={markerRef}
    ></Marker>
  );
};


const ReporteServicios = () => {
  const [location, setLocation] = useState<[number, number] | null>(null);
  const [servicios, setServicios] = useState({ agua: true, luz: true, internet: true, temblor:false, inundacion: false });
  const [users, setUsers] = useState<Array<{lat: number; lng: number; servicios: typeof servicios}>>([]);
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(null);
  const [changeLoc, setChangeLoc] = useState<boolean>(false);
    const mapRef = useRef<L.Map>(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const posArr: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setLocation(posArr);
        setMarkerPosition(posArr);
      },
      () => alert('No se pudo obtener la ubicación'),
      { enableHighAccuracy: true }
    );
  }, []);

useEffect(() => {
  socket.on('initialUserData', (userData) => {
    setLocation([userData.lat, userData.lng]);
    setServicios(userData.servicios);
  });

  socket.on('usersUpdate', (usersData) => setUsers(usersData));

  return () => {
    socket.off('initialUserData');
    socket.off('usersUpdate');
  };
}, []);


  // Send status update to server
  useEffect(() => {
    if (location) {
      socket.emit('updateStatus', { lat: location[0], lng: location[1], servicios });
    }
  }, [location, servicios]);

  const handleChange = (service: 'agua' | 'luz' | 'internet' | 'temblor' | 'inundacion') => {
    setServicios((prev) => ({ ...prev, [service]: !prev[service] }));
  };

   const getMarkerIcon = (serviciosUsuario: { agua: boolean, luz: boolean, internet: boolean, temblor: boolean, inundacion:boolean }) => {
    const color = (!serviciosUsuario.agua || !serviciosUsuario.luz || !serviciosUsuario.internet || serviciosUsuario.temblor || serviciosUsuario.inundacion) ? 'red' : 'green';
    return L.divIcon({
      html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white;"></div>`,
      className: '',
      iconSize: [20, 20]
    });
  };

    const confirmPosition = () => {
    if (markerPosition) {
      setLocation(markerPosition);
      socket.emit('updateStatus', { lat: markerPosition[0], lng: markerPosition[1], servicios });
      setChangeLoc(false);
    }
    setChangeLoc(false);
  };

   const centerMapOnUser = () => {
    if (mapRef.current && location) {
      mapRef.current.setView(location, 18, { animate: true });
    }
  };

  return (
  <div className="min-h-screen bg-gradient-to-r from-blue-50 to-white flex flex-col items-center p-6">
    <div className="bg-white shadow-lg border-2 border-black rounded-lg p-6 max-w-md w-full">
      <h1 className="text-3xl font-extrabold mb-6 text-center text-black">Mapa de area</h1>
      

      {changeLoc && <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Ajusta tu ubicación</h2>
        {markerPosition && (
          <MapContainer center={markerPosition} zoom={18} style={{ height: '300px', width: '100%' }} >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />
            <DraggableMarker position={markerPosition} onPositionChange={setMarkerPosition} />
          </MapContainer>
        )}
        <button
          className="mt-2 px-4 py-2 w-full bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={confirmPosition}
        >
          Confirmar ubicación
        </button>
      </div>}

      
      {location && !changeLoc &&  (
        <MapContainer center={location} zoom={18} style={{ height: '400px', width: '100%' }} ref={mapRef} className="rounded-lg border-2 border-black overflow-hidden shadow-lg">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
           {users.map((user, idx) => (
          <Marker key={idx} position={[user.lat, user.lng]} icon={getMarkerIcon(user.servicios)}>
            <Popup>
              <div className="w-48">
                <h3 className="font-bold text-lg mb-3 border-b border-gray-200 pb-2 text-center text-gray-800">Servicios</h3>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">💧</span>
                    <span className={user.servicios.agua ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                      Agua: {user.servicios.agua ? 'Disponible' : 'No disponible'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">💡</span>
                    <span className={user.servicios.luz ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                      Luz: {user.servicios.luz ? 'Disponible' : 'No disponible'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">📶</span>
                    <span className={user.servicios.internet ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                      Internet: {user.servicios.internet ? 'Disponible' : 'No disponible'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">⛰️</span>
                    <span className={!user.servicios.temblor ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                      Temblor: {user.servicios.temblor ? 'Si lo senti' : 'No'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🌊</span>
                    <span className={!user.servicios.inundacion ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                      Inundacion: {user.servicios.inundacion ? 'Me inundo' : 'No'}
                    </span>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
            ))}
        </MapContainer>
        
      )}
      <div className="flex flex-wrap  gap-2  mt-2 w-full">
        {['agua', 'luz', 'internet', 'inundacion', 'temblor'].map((service) => (
          <button
            key={service}
            onClick={() => handleChange(service as 'agua' | 'luz' | 'internet' | 'temblor' | 'inundacion')}
            className={`transition-colors flex-1  cursor-pointer duration-300 select-none px-5 py-3 rounded-md font-semibold text-white shadow-md 
              ${servicios[service as keyof typeof servicios] ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}
          >
            {service.toUpperCase() }
            {/* {service.toUpperCase() }: {servicios[service as keyof typeof servicios] ? 'Sí' : 'No'} */}
          </button>
        ))}
      </div>
       {!changeLoc && <div className='flex flex-row gap-2 mt-2'>
        <button 
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-green-700" 
            onClick={centerMapOnUser}
          >
            Centrar en mi ubicación
          </button>
          <button 
            className="mt-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-green-700" 
            onClick={() => setChangeLoc(!changeLoc)}
          >
            Cambiar ubicación
          </button>
       </div>}
    </div>
  </div>
  );
};

export default ReporteServicios;
