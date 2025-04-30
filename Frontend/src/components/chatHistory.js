// "use client";
// import { useState } from "react";
// import { MoreVertical, Edit, Trash } from "lucide-react";

// export default function PolicyButtonsWithMenu() {
//   const [topics, setTopics] = useState([
//     "Access Control",
//     "Encryption",
//     "Data Retention",
//     "Incident Response",
//   ]);
  
//   const [openMenuId, setOpenMenuId] = useState(null);
  
//   const handleDelete = (index) => {
//     setTopics(topics.filter((_, i) => i !== index));
//     setOpenMenuId(null);
//   };
  
//   const handleRename = (index) => {
//     const newName = prompt("Enter new name:", topics[index]);
//     if (newName && newName.trim()) {
//       const newTopics = [...topics];
//       newTopics[index] = newName.trim();
//       setTopics(newTopics);
//     }
//     setOpenMenuId(null);
//   };
  
//   return (
//     <div className="space-y-2">
//       {topics.map((topic, index) => (
//         <div key={index} className="relative flex items-center">
//           <button
//             className="w-full text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-700 transition flex items-center justify-between"
//           >
//             <span>{topic}</span>
//             <div 
//               className="cursor-pointer p-1 rounded-full hover:bg-gray-200"
//               onClick={(e) => {
//                 e.stopPropagation();
//                 setOpenMenuId(openMenuId === index ? null : index);
//               }}
//             >
//               <MoreVertical size={16} />
//             </div>
//           </button>
          
//           {openMenuId === index && (
//             <div className="absolute right-0 top-full mt-1 bg-white shadow-lg rounded-md py-1 z-10 border border-gray-200">
//               <button 
//                 className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
//                 onClick={() => handleRename(index)}
//               >
//                 <Edit size={14} className="mr-2" />
//                 Rename
//               </button>
//               <button 
//                 className="flex items-center px-3 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left"
//                 onClick={() => handleDelete(index)}
//               >
//                 <Trash size={14} className="mr-2" />
//                 Delete
//               </button>
//             </div>
//           )}
//         </div>
//       ))}
//     </div>
//   );
// }
import { useState, useRef, useEffect } from "react";
import { MoreVertical, Edit, Trash, Check, X } from "lucide-react";

export default function PolicyButtonsWithMenu() {
  const [topics, setTopics] = useState([
    "Access Control",
    "Encryption",
    "Data Retention",
    "Incident Response",
  ]);
  
  const [openMenuId, setOpenMenuId] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef(null);
  
  // Focus input when editing starts
  useEffect(() => {
    if (editingIndex !== null && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingIndex]);
  
  const handleDelete = (index) => {
    setTopics(topics.filter((_, i) => i !== index));
    setOpenMenuId(null);
  };
  
  const startEditing = (index) => {
    setEditingIndex(index);
    setEditValue(topics[index]);
    setOpenMenuId(null);
  };
  
  const saveEdit = () => {
    if (editValue.trim()) {
      const newTopics = [...topics];
      newTopics[editingIndex] = editValue.trim();
      setTopics(newTopics);
    }
    cancelEdit();
  };
  
  const cancelEdit = () => {
    setEditingIndex(null);
    setEditValue("");
  };
  
  const handleMenuToggle = (e, index) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === index ? null : index);
  };
  
  // Close menu when clicking outside
  const handleClickOutside = () => {
    if (openMenuId !== null) {
      setOpenMenuId(null);
    }
  };

  // Handle key press in edit input
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      saveEdit();
    } else if (e.key === "Escape") {
      cancelEdit();
    }
  };
  
  return (
    <div className="space-y-2" onClick={handleClickOutside}>
      {topics.map((topic, index) => (
        <div key={index} className="relative flex items-center">
          {editingIndex === index ? (
            // Editing mode
            <div className="w-full flex items-center bg-white border border-blue-300 rounded-lg px-2 py-1">
              <input
                ref={inputRef}
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-grow px-1 py-1 text-sm text-gray-600 outline-none"
              />
              <div className="flex space-x-1">
                <button 
                  onClick={saveEdit} 
                  className="p-1 text-green-600 hover:bg-gray-100 rounded-full"
                >
                  <Check size={16} />
                </button>
              </div>
            </div>
          ) : (
            // Normal mode
            <button
              className="w-full text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-700 transition flex items-center justify-between"
            >
              <span>{topic}</span>
              <div 
                className="cursor-pointer p-1 rounded-full hover:bg-gray-200"
                onClick={(e) => handleMenuToggle(e, index)}
              >
                <MoreVertical size={16} />
              </div>
            </button>
          )}
          
          {/* Menu dropdown */}
          {openMenuId === index && (
            <div className="absolute right-0 top-full mt-1 bg-white shadow-lg rounded-md py-1 z-10 border border-gray-200">
              <button 
                className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                onClick={(e) => {
                  e.stopPropagation();
                  startEditing(index);
                }}
              >
                <Edit size={14} className="mr-2" />
                Rename
              </button>
              <button 
                className="flex items-center px-3 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(index);
                }}
              >
                <Trash size={14} className="mr-2" />
                Delete
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}