import React from 'react'
    import Lottie from 'lottie-react'

    const LottieButton = ({ animationData, onClick, className, style }) => {
      return (
        <button onClick={onClick} className={className} style={style}>
          <Lottie animationData={animationData} style={{ height: '24px', width: '24px' }}/>
        </button>
      )
    }

    export default LottieButton
