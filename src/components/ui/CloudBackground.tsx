'use client'

interface CloudBackgroundProps {
  children: React.ReactNode
  variant?: 'full' | 'header'
}

export function CloudBackground({ children, variant = 'full' }: CloudBackgroundProps) {
  if (variant === 'header') {
    return (
      <div className="relative overflow-hidden">
        {/* 渐变背景 */}
        <div className="absolute inset-0 bg-gradient-to-r from-sky via-sky-light to-sunset-warm" />

        {/* 云朵装饰 */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="cloud cloud-1"
            style={{ top: '10%', left: '10%' }}
          />
          <div
            className="cloud cloud-2"
            style={{ top: '20%', left: '60%' }}
          />
          <div
            className="cloud cloud-3"
            style={{ top: '5%', left: '35%' }}
          />
        </div>

        {/* 内容层 */}
        <div className="relative z-10">
          {children}
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen sky-bg">
      {/* 云朵装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="cloud cloud-1"
          style={{ top: '15%', left: '5%' }}
        />
        <div
          className="cloud cloud-2"
          style={{ top: '25%', right: '10%' }}
        />
        <div
          className="cloud cloud-3"
          style={{ top: '40%', left: '20%' }}
        />
        <div
          className="cloud cloud-1"
          style={{ top: '60%', right: '25%' }}
        />
      </div>

      {/* 内容层 */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}
