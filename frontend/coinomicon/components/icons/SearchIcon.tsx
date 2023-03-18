import React from 'react'

interface Props {
  size: number
}

export const SearchIcon = (props: Props) => {
  const { size } = props

  return (
    <svg
      fill="none"
      height={size || 24}
      viewBox="0 0 24 24"
      width={size || 24}
      {...props}
    >
      <path
        d="M11.5 21a9.5 9.5 0 1 0 0-19 9.5 9.5 0 0 0 0 19ZM22 22l-2-2"
        stroke="var(--nextui-colors-accents6)"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
      />
    </svg>
  )
}
