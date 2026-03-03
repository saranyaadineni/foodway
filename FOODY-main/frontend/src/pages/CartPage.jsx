import React from 'react'
import { IoIosArrowRoundBack, IoIosSearch } from "react-icons/io";
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import CartItemCard from '../components/CartItemCard';
import { syncCartPrices, setUserData } from '../redux/userSlice';
import { FiHelpCircle, FiUser } from 'react-icons/fi';
import { authAPI } from '../api';
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";

function CartPage() {
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const { cartItems, totalAmount, itemsInMyCity, userData } = useSelector(state => state.user)
    
    const [authState, setAuthState] = React.useState('initial'); // 'initial', 'login', 'signup'
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [fullName, setFullName] = React.useState('');
    const [mobile, setMobile] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState('');
    const [showPassword, setShowPassword] = React.useState(false);

    React.useEffect(() => {
        if (itemsInMyCity && itemsInMyCity.length) {
            dispatch(syncCartPrices(itemsInMyCity))
        }
    }, [itemsInMyCity, dispatch])

    const isLoggedIn = !!userData;

    const handleSignIn = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const result = await authAPI.signin({ email, password });
            if (result.status === 200) {
                if (result.data?.token) {
                    localStorage.setItem('token', result.data.token)
                }
                dispatch(setUserData(result.data));
            }
        } catch (error) {
            setError(error?.response?.data?.message || "Sign-in failed");
        }
        setLoading(false);
    };

    const handleSignUp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const result = await authAPI.signup({
                fullName,
                email,
                password,
                mobile,
                role: 'user'
            });
            if (result.data?.token) {
                localStorage.setItem('token', result.data.token)
            }
            dispatch(setUserData(result.data));
        } catch (error) {
            setError(error?.response?.data?.message || "Sign-up failed");
        }
        setLoading(false);
    };

    if (cartItems?.length === 0) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center">
                {/* Simple Header */}
                <div className="w-full h-[70px] px-8 flex items-center justify-between border-b border-gray-100">
                    <div className="flex items-center gap-4">
                        <h1
                            className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#fc8019] to-[#ff2b85] cursor-pointer"
                            onClick={() => navigate("/")}
                        >
                            Food<span className="text-[#ff2b85]">Way</span>
                        </h1>
                        <div className="h-6 w-[2px] bg-gray-200"></div>
                        <span className="text-gray-600 font-bold tracking-widest text-sm">SECURE CHECKOUT</span>
                    </div>
                    <div className="flex items-center gap-8">
                        <div 
                            className="flex items-center gap-2 text-gray-700 hover:text-[#fc8019] cursor-pointer font-medium text-sm"
                            onClick={() => navigate("/help")}
                        >
                            <FiHelpCircle size={18} />
                            <span>Help</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700 hover:text-[#fc8019] cursor-pointer font-medium text-sm" onClick={() => navigate('/signin')}>
                            <FiUser size={18} />
                            <span>Sign In</span>
                        </div>
                    </div>
                </div>

                {/* Empty Cart Content */}
                <div className="flex flex-col items-center justify-center flex-1 py-20 text-center px-4">
                    <div className="w-64 h-64 mb-8 bg-gray-50 rounded-full flex items-center justify-center">
                        <svg className="w-40 h-40 text-gray-200" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-700 mb-2">Your cart is empty</h2>
                    <p className="text-gray-500 text-sm mb-8">You can go to home page to view more restaurants</p>
                    <button
                        onClick={() => navigate("/")}
                        className="bg-[#fc8019] text-white px-6 py-3 font-bold text-sm rounded shadow-lg hover:shadow-xl transition-all uppercase tracking-wide"
                    >
                        See restaurants near you
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#e9ecee]">
            {/* Header */}
            <div className="w-full h-[70px] bg-white px-8 flex items-center justify-between border-b border-gray-100 sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <h1
                        className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#fc8019] to-[#ff2b85] cursor-pointer"
                        onClick={() => navigate("/")}
                    >
                        Food<span className="text-[#ff2b85]">Way</span>
                    </h1>
                    <div className="h-6 w-[2px] bg-gray-200"></div>
                    <span className="text-gray-600 font-bold tracking-widest text-sm uppercase">Secure Checkout</span>
                </div>
                <div className="flex items-center gap-8">
                    <div 
                        className="flex items-center gap-2 text-gray-700 hover:text-[#fc8019] cursor-pointer font-medium text-sm"
                        onClick={() => navigate("/help")}
                    >
                        <FiHelpCircle size={18} />
                        <span>Help</span>
                    </div>
                    {isLoggedIn ? (
                        <div className="flex items-center gap-2 text-gray-700 font-medium text-sm">
                            <div className="w-8 h-8 rounded-full bg-[#fc8019] text-white flex items-center justify-center font-bold">
                                {userData?.fullName?.charAt(0).toUpperCase()}
                            </div>
                            <span>{userData?.fullName?.split(' ')[0]}</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-gray-700 hover:text-[#fc8019] cursor-pointer font-medium text-sm" onClick={() => navigate('/signin')}>
                            <FiUser size={18} />
                            <span>Sign In</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="max-w-[1200px] mx-auto py-8 px-4 flex flex-col md:flex-row gap-8">
                {/* Left Side - Auth and Address (if needed) */}
                <div className="flex-1 space-y-4">
                    {!isLoggedIn && (
                        <div className="bg-white p-10 shadow-sm border border-gray-100 flex items-start gap-8 min-h-[300px] transition-all duration-300">
                            <div className="bg-[#282c3f] p-4 rounded text-white mt-1">
                                <FiUser size={24} />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-xl font-bold text-[#282c3f] mb-1">Account</h2>
                                <p className="text-[#7e808c] text-sm mb-6">To place your order now, log in to your existing account or sign up.</p>
                                
                                {authState === 'initial' && (
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => setAuthState('login')}
                                            className="flex-1 border-2 border-[#60b246] text-[#60b246] font-bold py-3 px-6 hover:shadow-md transition-all text-sm uppercase"
                                        >
                                            <div className="text-xs font-normal mb-1">Have an account?</div>
                                            LOG IN
                                        </button>
                                        <button
                                            onClick={() => setAuthState('signup')}
                                            className="flex-1 bg-[#60b246] text-white font-bold py-3 px-6 hover:shadow-md transition-all text-sm uppercase border-2 border-[#60b246]"
                                        >
                                            <div className="text-xs font-normal mb-1">New to FoodWay?</div>
                                            SIGN UP
                                        </button>
                                    </div>
                                )}

                                {authState === 'login' && (
                                    <form onSubmit={handleSignIn} className="animate-fade-in max-w-sm">
                                        <p className="text-xs text-[#7e808c] mb-4">
                                            Enter login details or <span className="text-[#fc8019] cursor-pointer" onClick={() => { setAuthState('signup'); setError(''); }}>create an account</span>
                                        </p>
                                        <div className="space-y-4">
                                            <div className="relative border border-gray-300 px-4 pt-5 pb-2 rounded">
                                                <label className="absolute top-1 left-4 text-[10px] text-gray-500 uppercase font-bold">Email Address</label>
                                                <input 
                                                    type="email" 
                                                    required
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    className="w-full outline-none text-sm text-gray-800"
                                                    placeholder="Enter email address"
                                                />
                                            </div>
                                            <div className="relative border border-gray-300 px-4 pt-5 pb-2 rounded">
                                                <label className="absolute top-1 left-4 text-[10px] text-gray-500 uppercase font-bold">Password</label>
                                                <div className="flex items-center">
                                                    <input 
                                                        type={showPassword ? "text" : "password"} 
                                                        required
                                                        value={password}
                                                        onChange={(e) => setPassword(e.target.value)}
                                                        className="w-full outline-none text-sm text-gray-800"
                                                        placeholder="Enter password"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="text-gray-400 hover:text-gray-600 transition-colors"
                                                    >
                                                        {showPassword ? <FaRegEyeSlash size={16} /> : <FaRegEye size={16} />}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <button 
                                            type="submit" 
                                            disabled={loading}
                                            className="w-full bg-[#60b246] text-white font-bold py-3 mt-6 text-sm hover:shadow-lg transition-all"
                                        >
                                            {loading ? "LOGGING IN..." : "LOGIN"}
                                        </button>
                                        {error && <p className="text-xs text-red-500 mt-2 font-medium">{error}</p>}
                                        <p className="text-[10px] text-[#7e808c] mt-4">
                                            By clicking on Login, I accept the <span className="text-[#282c3f] font-bold">Terms & Conditions & Privacy Policy</span>
                                        </p>
                                    </form>
                                )}

                                {authState === 'signup' && (
                                    <form onSubmit={handleSignUp} className="animate-fade-in max-w-sm">
                                        <p className="text-xs text-[#7e808c] mb-4">
                                            Sign up or <span className="text-[#fc8019] cursor-pointer" onClick={() => { setAuthState('login'); setError(''); }}>log in to your account</span>
                                        </p>
                                        <div className="space-y-4">
                                            <div className="relative border border-gray-300 px-4 pt-5 pb-2 rounded">
                                                <label className="absolute top-1 left-4 text-[10px] text-gray-500 uppercase font-bold">Phone number</label>
                                                <input 
                                                    type="text" 
                                                    required
                                                    maxLength="10"
                                                    value={mobile}
                                                    onChange={(e) => {
                                                        const val = e.target.value.replace(/\D/g, '');
                                                        if (val.length <= 10) setMobile(val);
                                                    }}
                                                    className="w-full outline-none text-sm text-gray-800"
                                                    placeholder="Enter phone number"
                                                />
                                            </div>
                                            <div className="relative border border-gray-300 px-4 pt-5 pb-2 rounded">
                                                <label className="absolute top-1 left-4 text-[10px] text-gray-500 uppercase font-bold">Name</label>
                                                <input 
                                                    type="text" 
                                                    required
                                                    value={fullName}
                                                    onChange={(e) => setFullName(e.target.value)}
                                                    className="w-full outline-none text-sm text-gray-800"
                                                    placeholder="Enter name"
                                                />
                                            </div>
                                            <div className="relative border border-gray-300 px-4 pt-5 pb-2 rounded">
                                                <label className="absolute top-1 left-4 text-[10px] text-gray-500 uppercase font-bold">Email</label>
                                                <input 
                                                    type="email" 
                                                    required
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    className="w-full outline-none text-sm text-gray-800"
                                                    placeholder="Enter email"
                                                />
                                            </div>
                                            <div className="relative border border-gray-300 px-4 pt-5 pb-2 rounded">
                                                <label className="absolute top-1 left-4 text-[10px] text-gray-500 uppercase font-bold">Password</label>
                                                <div className="flex items-center">
                                                    <input 
                                                        type={showPassword ? "text" : "password"} 
                                                        required
                                                        value={password}
                                                        onChange={(e) => setPassword(e.target.value)}
                                                        className="w-full outline-none text-sm text-gray-800"
                                                        placeholder="Create password"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="text-gray-400 hover:text-gray-600 transition-colors"
                                                    >
                                                        {showPassword ? <FaRegEyeSlash size={16} /> : <FaRegEye size={16} />}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <button 
                                            type="submit" 
                                            disabled={loading}
                                            className="w-full bg-[#60b246] text-white font-bold py-3 mt-6 text-sm hover:shadow-lg transition-all"
                                        >
                                            {loading ? "CONTINUING..." : "CONTINUE"}
                                        </button>
                                        {error && <p className="text-xs text-red-500 mt-2 font-medium">{error}</p>}
                                        <p className="text-[10px] text-[#7e808c] mt-4">
                                            By creating an account, I accept the <span className="text-[#282c3f] font-bold">Terms & Conditions & Privacy Policy</span>
                                        </p>
                                    </form>
                                )}
                            </div>
                            <div className="hidden lg:block shrink-0">
                                <img src="/src/assets/image2.webp" alt="Food" className="w-32 h-32 object-contain opacity-50 grayscale" />
                            </div>
                        </div>
                    )}

                    {isLoggedIn && (
                        <div className="space-y-4">
                            <div className="bg-white p-8 shadow-sm border border-gray-100 flex items-center justify-between transition-all duration-300">
                                <div className="flex items-center gap-4">
                                    <div className="bg-[#60b246] p-2 rounded-full text-white">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h2 className="font-bold text-[#282c3f] text-lg">Logged in</h2>
                                        <p className="text-sm text-[#7e808c] font-medium mt-1">
                                            {userData?.fullName} | {userData?.mobile || userData?.email}
                                        </p>
                                    </div>
                                </div>
                                <div className="bg-[#282c3f] p-3 rounded text-white shrink-0">
                                    <FiUser size={20} />
                                </div>
                            </div>

                            {/* Delivery Address Section as per Image 4 */}
                            <div className="bg-white p-8 shadow-sm border border-gray-100 transition-all duration-300">
                                <div className="flex items-start gap-4">
                                    <div className="bg-[#282c3f] p-3 rounded text-white mt-1 shrink-0">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="text-xl font-bold text-[#282c3f] mb-1">Add a delivery address</h2>
                                        <p className="text-[#7e808c] text-sm mb-8">You seem to be in the new location</p>
                                        
                                        <div className="max-w-sm border border-gray-200 p-6 rounded hover:shadow-md transition-all group">
                                            <div className="flex items-start gap-3 mb-4">
                                                <div className="text-[#fc8019] mt-1">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-[#282c3f] text-sm mb-1">Add New Address</h3>
                                                    <p className="text-[#7e808c] text-xs leading-relaxed">
                                                        Enter your complete delivery address details to proceed
                                                    </p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => navigate("/checkout")}
                                                className="w-full border-2 border-[#60b246] text-[#60b246] font-bold py-2 px-4 text-xs hover:bg-[#60b246] hover:text-white transition-all uppercase tracking-wide"
                                            >
                                                Add New
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Placeholder */}
                            <div className="bg-white p-8 shadow-sm border border-gray-100 opacity-50">
                                <div className="flex items-center gap-4">
                                    <div className="bg-gray-200 p-2 rounded text-gray-500">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                        </svg>
                                    </div>
                                    <h2 className="font-bold text-gray-400">Payment</h2>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Side - Cart Items */}
                <div className="w-full md:w-[380px] bg-white p-6 shadow-sm border border-gray-100 h-fit">
                    <div className="flex items-start gap-4 mb-6">
                        <img 
                            src={cartItems?.[0]?.shop?.image || "/src/assets/shop.png"} 
                            alt="Shop" 
                            className="w-12 h-12 object-cover rounded"
                        />
                        <div>
                            <h3 className="font-bold text-[#282c3f] text-sm">{cartItems?.[0]?.shop?.name || "Restaurant"}</h3>
                            <p className="text-xs text-[#7e808c]">{cartItems?.[0]?.shop?.address || "Location"}</p>
                            <div className="w-10 h-1 bg-[#282c3f] mt-2"></div>
                        </div>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto space-y-4 mb-6 pr-2 custom-scrollbar">
                        {cartItems?.map((item, index) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2 flex-1">
                                    <div className={`w-3 h-3 border-2 ${item.isVeg ? 'border-green-600' : 'border-red-600'} flex items-center justify-center rounded-[1px]`}>
                                        <div className={`w-1 h-1 rounded-full ${item.isVeg ? 'bg-green-600' : 'bg-red-600'}`}></div>
                                    </div>
                                    <span className="text-[#3d4152] font-medium">{item.name}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center border border-gray-200 px-2 py-1 text-[#60b246] font-bold">
                                        <span className="w-4 text-center cursor-pointer hover:bg-gray-50">-</span>
                                        <span className="w-6 text-center text-xs">{item.quantity}</span>
                                        <span className="w-4 text-center cursor-pointer hover:bg-gray-50">+</span>
                                    </div>
                                    <span className="text-[#535665] w-12 text-right">₹{item.price * item.quantity}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="border-t-2 border-[#282c3f] pt-4 space-y-3">
                        <div className="flex justify-between text-sm font-bold text-[#282c3f]">
                            <span>TO PAY</span>
                            <span>₹{totalAmount}</span>
                        </div>
                        {isLoggedIn ? (
                            <button
                                onClick={() => navigate("/checkout")}
                                className="w-full bg-[#60b246] text-white font-bold py-3 text-sm hover:shadow-lg transition-all"
                            >
                                PROCEED TO CHECKOUT
                            </button>
                        ) : (
                            <p className="text-[10px] text-gray-400 text-center italic mt-4">
                                * Please log in to complete your order
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CartPage
