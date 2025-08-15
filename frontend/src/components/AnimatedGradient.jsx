export default function AnimatedGradient({ className='' }){
  return (
    <div className={"absolute inset-0 -z-10 opacity-30 blur-2xl animate-gradient " + className} style={{
      background: 'linear-gradient(-45deg, #6366F1, #A855F7, #22D3EE, #0EA5E9)',
      backgroundSize: '400% 400%'
    }} />
  )
}
