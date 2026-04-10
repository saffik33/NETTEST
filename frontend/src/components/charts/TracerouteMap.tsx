import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { TracerouteMapData } from '../../api/endpoints'

interface Props {
  data: TracerouteMapData
}

export default function TracerouteMap({ data }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current) return

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove()
      mapInstanceRef.current = null
    }

    const geoHops = data.hops.filter(h => h.geo)
    if (geoHops.length === 0) return

    const map = L.map(mapRef.current, {
      scrollWheelZoom: true,
      attributionControl: true,
    })
    mapInstanceRef.current = map

    // Dark theme tiles
    const isDark = document.documentElement.classList.contains('dark')
    const tileUrl = isDark
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'

    L.tileLayer(tileUrl, {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map)

    const points: L.LatLngExpression[] = []

    geoHops.forEach((hop, idx) => {
      if (!hop.geo) return
      const latlng: L.LatLngExpression = [hop.geo.lat, hop.geo.lon]
      points.push(latlng)

      const isFirst = idx === 0
      const isLast = idx === geoHops.length - 1

      const marker = L.circleMarker(latlng, {
        radius: isFirst || isLast ? 8 : 5,
        color: isFirst ? '#34d399' : isLast ? '#f87171' : '#00d4ff',
        fillColor: isFirst ? '#34d399' : isLast ? '#f87171' : '#00d4ff',
        fillOpacity: 0.85,
        weight: 2,
      }).addTo(map)

      const label = [
        `<b style="color:#00d4ff">Hop ${hop.hop_number}</b>`,
        hop.ip_address ? `IP: ${hop.ip_address}` : '',
        hop.hostname ? `Host: ${hop.hostname}` : '',
        hop.avg_rtt_ms != null ? `RTT: ${hop.avg_rtt_ms}ms` : '',
        hop.geo.city ? `${hop.geo.city}, ${hop.geo.country}` : hop.geo.country || '',
        hop.geo.isp || '',
      ].filter(Boolean).join('<br/>')

      marker.bindPopup(label)
    })

    if (points.length >= 2) {
      L.polyline(points, {
        color: '#00d4ff',
        weight: 3,
        opacity: 0.6,
        dashArray: '8, 4',
      }).addTo(map)
    }

    if (points.length > 0) {
      map.fitBounds(L.latLngBounds(points), { padding: [40, 40] })
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [data])

  const geoCount = data.hops.filter(h => h.geo).length

  return (
    <div className="rounded-2xl overflow-hidden">
      <div ref={mapRef} style={{ height: 400, width: '100%' }} />
      {geoCount === 0 && (
        <div className="p-4 text-center dark:text-gray-500 text-gray-400 text-sm">
          No geolocation data available for these hops (all private IPs)
        </div>
      )}
    </div>
  )
}
