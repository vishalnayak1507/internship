import logo from './logo.svg';
import './App.css';
import FileUpload from './components/admin/fileUpload/FileUpload';

import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";

function App() {
  return (
<>
      <FileUpload />
      <ToastContainer /> {/* <-- This line is required */}
    </>
  
);
}

export default App;
