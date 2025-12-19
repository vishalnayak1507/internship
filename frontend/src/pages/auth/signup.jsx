
import SignupCard from "../../components/auth/SignupCard.jsx"
import leftImage from "../../assets/side-left.png"
import rightImage from "../../assets/side-right.png"

const Signup = () => {
  return (
    
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300 flex items-center justify-center px-4">
      <div className="flex flex-col md:flex-row items-center justify-center w-full max-w-6xl gap-12">
        
        {/* Left Image */}
        <div className="hidden md:block w-[330px]">
          <img src={leftImage} alt="Left Visual" className="rounded-3xl  w-full h-auto object-cover optacity-90 drop-shadow-lg " />
        </div>

        {/* Signup Card */}
        <div className="w-full max-w-sm md:max-w-md">
          <SignupCard />
        </div>

        {/* Right Image */}
        <div className="hidden md:block w-[330px]">
          <img src={rightImage} alt="Right Visual" className="rounded-3xl  w-full h-auto object-cover optacity-90 drop-shadow-lg " />
        </div>

      </div>
    </div>
  )
}

export default Signup
