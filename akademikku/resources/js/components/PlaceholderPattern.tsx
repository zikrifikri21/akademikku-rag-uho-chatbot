export function PlaceholderPattern() {
  return (
    <svg
      className="absolute inset-0 h-full w-full stroke-neutral-900/10 dark:stroke-neutral-100/10"
      fill="none"
    >
      <defs>
        <pattern
          id="pattern-placeholder"
          x="0"
          y="0"
          width="10"
          height="10"
          patternUnits="userSpaceOnUse"
        >
          <path d="M-3 13L13 -3M-2 18L18 -2M-1 23L23 -1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" strokeWidth="0" fill="url(#pattern-placeholder)" />
    </svg>
  )
}
