const ConnectionState = ({ isConnected }: { isConnected: boolean }) => {
  return (
    <p>State: {'' + isConnected}</p>
  )
}

export default ConnectionState
