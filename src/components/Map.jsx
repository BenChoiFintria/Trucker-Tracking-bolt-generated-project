import React from 'react'
    import { GoogleMap, Marker, useLoadScript } from '@react-google-maps/api'

    const mapContainerStyle = {
      width: '100%',
      height: '500px'
    }

    const center = {
      lat: 34.0522,
      lng: -118.2437
    }

    const options = {
      disableDefaultUI: true,
      zoomControl: true
    }

    export default function Map({ markers }) {
      const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: 'AIzaSyBbTIY9-3Mn3gkpbyYLtlhZ7Ul3ntg67fc'
      })

      if (loadError) return <div>Error loading maps</div>
      if (!isLoaded) return <div>Loading Maps...</div>

      return (
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          zoom={12}
          center={center}
          options={options}
        >
          {markers && markers.map((marker, index) => (
            <Marker
              key={index}
              position={{ lat: marker.lat, lng: marker.lng }}
              label={marker.label}
            />
          ))}
        </GoogleMap>
      )
    }
