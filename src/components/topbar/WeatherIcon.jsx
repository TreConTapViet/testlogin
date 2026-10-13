// Icon thời tiết nhiều màu, phong cách gần với ứng dụng Thời tiết trên iOS (khung 24x24)

function Sun() {
  return (
    <g>
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
        <line
          key={angle}
          x1="12"
          y1="2.7"
          x2="12"
          y2="5"
          stroke="#FFC23C"
          strokeWidth="1.7"
          strokeLinecap="round"
          transform={`rotate(${angle} 12 12)`}
        />
      ))}
      <circle cx="12" cy="12" r="4.6" fill="#FFC93C" />
    </g>
  )
}

function Moon() {
  return <path d="M15.8 4.2a8 8 0 1 0 4 12.6 6.6 6.6 0 0 1-4-12.6Z" fill="#DCD7F4" stroke="#BDB6E6" strokeWidth="0.6" />
}

function Cloud({ fill = '#E9EEF5', transform }) {
  return (
    <path
      d="M7 19.5a4.5 4.5 0 0 1-.6-8.96 6 6 0 0 1 11.5-1.4 4.6 4.6 0 0 1-.5 10.36Z"
      fill={fill}
      stroke="#BCC6D3"
      strokeWidth="0.7"
      transform={transform}
    />
  )
}

export default function WeatherIcon({ kind, isDay = true, className }) {
  const SkyBody = isDay ? Sun : Moon
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false">
      {kind === 'clear' && <SkyBody />}
      {kind === 'partly' && (
        <>
          <g transform="translate(-1.5 -2) scale(0.78)">
            <SkyBody />
          </g>
          <Cloud transform="translate(4.2 4.6) scale(0.8)" />
        </>
      )}
      {kind === 'cloud' && <Cloud />}
      {kind === 'fog' && (
        <>
          <Cloud transform="translate(0 -3)" />
          <path d="M5 19.5h14M7.5 22h9" stroke="#B7C1CE" strokeWidth="1.6" strokeLinecap="round" />
        </>
      )}
      {kind === 'rain' && (
        <>
          <Cloud fill="#C9D3E0" transform="translate(0 -3)" />
          <path d="M8.5 18.6l-1 2.6M12.5 18.6l-1 2.6M16.5 18.6l-1 2.6" stroke="#4EA3F1" strokeWidth="1.7" strokeLinecap="round" />
        </>
      )}
      {kind === 'storm' && (
        <>
          <Cloud fill="#AEB9C8" transform="translate(0 -3)" />
          <path d="M12.8 15.4 10.6 19h2.6l-1.6 3.4" fill="none" stroke="#FFB627" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
      {kind === 'snow' && (
        <>
          <Cloud transform="translate(0 -3)" />
          <circle cx="8.5" cy="19.6" r="1" fill="#8FC2F2" />
          <circle cx="12" cy="21.4" r="1" fill="#8FC2F2" />
          <circle cx="15.5" cy="19.6" r="1" fill="#8FC2F2" />
        </>
      )}
    </svg>
  )
}
