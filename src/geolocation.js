// Returns a point only to the caller; never persists or transmits it.
export function currentSearchLocation(geolocation, secure = true) {
  if (!secure) return Promise.reject(new Error('La ubicación requiere una conexión segura. Abrí https://needu.patyapps.com.'));
  if (!geolocation) return Promise.reject(new Error('Este navegador no permite obtener la ubicación. Podés elegir una localidad.'));
  return new Promise((resolve, reject) => {
    geolocation.getCurrentPosition(position => {
      const {latitude: lat, longitude: lon, accuracy} = position.coords;
      if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat)>90 || Math.abs(lon)>180) {
        reject(new Error('No recibimos una ubicación válida. Volvé a intentar o elegí una localidad.'));
        return;
      }
      resolve({lat, lon, accuracy: Number.isFinite(accuracy) && accuracy >= 0 ? accuracy : null, label:'Mi ubicación actual'});
    }, error => {
      const messages = {
        1:'No diste permiso de ubicación. Podés habilitarlo en los permisos del navegador y reintentar, o elegir una localidad.',
        2:'No pudimos determinar dónde estás. Revisá que la ubicación del dispositivo esté activada o elegí una localidad.',
        3:'La ubicación tardó demasiado. Volvé a intentar o elegí una localidad.'
      };
      reject(new Error(messages[error?.code] || 'No pudimos obtener tu ubicación. Volvé a intentar o elegí una localidad.'));
    }, {enableHighAccuracy:true, timeout:10000, maximumAge:0});
  });
}
