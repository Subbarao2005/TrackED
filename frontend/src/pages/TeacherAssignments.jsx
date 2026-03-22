import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Network, Users, User, Share2, Briefcase, Zap, AlertCircle } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function TeacherAssignments() {
  const [mentors, setMentors] = useState([]);
  const [unassigned, setUnassigned] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMapping = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/teacher/students-mapping', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const { students, mentors } = res.data;
      
      // Structure state for DnD
      // Board columns: Unassigned pool + 1 column per mentor
      const mentorCols = mentors.map(m => ({
        id: m._id,
        name: m.user?.name || 'Unknown Mentor',
        students: students.filter(s => s.mentor?._id === m._id)
      }));
      setMentors(mentorCols);
      setUnassigned(students.filter(s => !s.mentor));
      
    } catch (err) {
      toast.error("Failed to query live mapping from MongoDB.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMapping();
  }, []);

  const handleDragEnd = async (result) => {
    const { source, destination, draggableId } = result;

    if (!destination) return; // Dropped outside a valid column
    if (source.droppableId === destination.droppableId) return; // Dropped in the same column

    // Optimistically update UI
    const sourceColId = source.droppableId;
    const destColId = destination.droppableId;
    
    let studentToMove;
    let newUnassigned = [...unassigned];
    let newMentors = mentors.map(m => ({ ...m, students: [...m.students] }));

    // Find and remove from source
    if (sourceColId === 'unassigned') {
      const idx = newUnassigned.findIndex(s => s._id === draggableId);
      studentToMove = newUnassigned[idx];
      newUnassigned.splice(idx, 1);
    } else {
      const mentorCol = newMentors.find(m => m.id === sourceColId);
      const idx = mentorCol.students.findIndex(s => s._id === draggableId);
      studentToMove = mentorCol.students[idx];
      mentorCol.students.splice(idx, 1);
    }

    // Add to destination
    if (destColId === 'unassigned') {
      newUnassigned.splice(destination.index, 0, studentToMove);
    } else {
      const mentorCol = newMentors.find(m => m.id === destColId);
      mentorCol.students.splice(destination.index, 0, studentToMove);
    }

    setUnassigned(newUnassigned);
    setMentors(newMentors);

    // Persist to backend
    try {
      const token = localStorage.getItem('token');
      const updatedMentorId = destColId === 'unassigned' ? 'unassigned' : destColId;
      await axios.put(`http://localhost:5000/api/teacher/assign`, 
        { studentId: draggableId, mentorId: updatedMentorId }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(destColId === 'unassigned' ? 'Student unassigned.' : 'Student mapped successfully!');
    } catch (err) {
      toast.error("Mapping mutation failed! Reverting UI.");
      fetchMapping(); // Rollback if backend fails
    }
  };

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 flex">
      <Sidebar role="teacher" />

      <div className="flex-1 ml-64 p-8 overflow-hidden flex flex-col h-screen">
        <header className="flex justify-between items-center mb-8 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-indigo-500/30 to-purple-500/10 p-3 rounded-2xl border border-indigo-500/30">
              <Network className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Mapping Logic Engine</h1>
              <p className="text-slate-400 text-sm mt-1">Drag and drop students to dynamically update MongoDB relational bindings.</p>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="shimmer w-96 h-20 rounded-2xl"></div>
          </div>
        ) : (
          <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4 custom-scrollbar">
            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="flex gap-6 h-full items-start min-w-max px-2 pt-2">
                
                {/* UNASSIGNED POOL COLUMN */}
                <div className="w-[340px] h-full flex flex-col bg-[#0A0F1C] border-2 border-dashed border-rose-500/30 rounded-3xl p-4 flex-shrink-0">
                  <div className="flex items-center justify-between mb-4 px-2">
                    <h2 className="font-bold text-rose-400 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5"/> Unassigned Pool
                    </h2>
                    <span className="bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full text-xs font-bold">{unassigned.length}</span>
                  </div>
                  
                  <Droppable droppableId="unassigned">
                    {(provided, snapshot) => (
                      <div 
                        ref={provided.innerRef} 
                        {...provided.droppableProps}
                        className={`flex-1 overflow-y-auto custom-scrollbar p-2 rounded-2xl space-y-3 transition-colors ${snapshot.isDraggingOver ? 'bg-rose-500/5' : ''}`}
                      >
                        {unassigned.length === 0 && !snapshot.isDraggingOver && (
                          <div className="h-full flex flex-col items-center justify-center text-rose-400/50">
                            <Users className="w-10 h-10 mb-2 opacity-50"/>
                            <p className="text-xs font-bold uppercase tracking-widest text-center">Pool Empty</p>
                          </div>
                        )}
                        {unassigned.map((s, index) => (
                           <Draggable key={s._id} draggableId={s._id} index={index}>
                             {(provided, snapshot) => (
                               <div
                                 ref={provided.innerRef}
                                 {...provided.draggableProps}
                                 {...provided.dragHandleProps}
                                 className={`bg-slate-900 border ${snapshot.isDragging ? 'border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.3)]' : 'border-slate-800'} p-4 rounded-2xl flex items-center gap-3 transition-all`}
                               >
                                 <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-500/20 to-orange-500/20 flex flex-shrink-0 items-center justify-center border border-rose-500/30 text-rose-400 font-bold text-xs">
                                   {s.user?.name?.charAt(0) || '?'}
                                 </div>
                                 <div className="min-w-0">
                                   <p className="font-bold text-sm text-slate-200 truncate">{s.user?.name || 'Unknown'}</p>
                                   <p className="text-[10px] text-slate-500 truncate">{s.user?.email}</p>
                                 </div>
                               </div>
                             )}
                           </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>

                {/* MENTOR COLUMNS */}
                {mentors.map(mentor => (
                  <div key={mentor.id} className="w-[340px] h-full flex flex-col bg-[#0A0F1C] border border-cyan-500/20 rounded-3xl p-4 shadow-lg flex-shrink-0">
                    <div className="flex items-center justify-between mb-4 px-2">
                       <h2 className="font-bold text-cyan-400 flex items-center gap-2">
                         <Briefcase className="w-5 h-5 text-cyan-500"/> {mentor.name}
                       </h2>
                       <span className="bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full text-xs font-bold">{mentor.students.length}</span>
                    </div>

                    <Droppable droppableId={mentor.id}>
                      {(provided, snapshot) => (
                        <div 
                          ref={provided.innerRef} 
                          {...provided.droppableProps}
                          className={`flex-1 overflow-y-auto custom-scrollbar p-2 rounded-2xl space-y-3 transition-colors ${snapshot.isDraggingOver ? 'bg-cyan-500/5 ring-1 ring-cyan-500/30' : 'bg-slate-900/30'}`}
                        >
                          {mentor.students.length === 0 && !snapshot.isDraggingOver && (
                            <div className="h-full flex flex-col items-center justify-center text-cyan-400/30">
                              <Share2 className="w-10 h-10 mb-2 opacity-50"/>
                              <p className="text-xs font-bold uppercase tracking-widest text-center">No Roster Assigments</p>
                              <p className="text-[10px] text-center mt-2 px-6">Drop students here to bind them to this Mentor.</p>
                            </div>
                          )}
                          {mentor.students.map((s, index) => (
                             <Draggable key={s._id} draggableId={s._id} index={index}>
                               {(provided, snapshot) => (
                                 <div
                                   ref={provided.innerRef}
                                   {...provided.draggableProps}
                                   {...provided.dragHandleProps}
                                   className={`bg-slate-900 border ${snapshot.isDragging ? 'border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.3)]' : 'border-slate-800 hover:border-slate-700'} p-4 rounded-2xl flex items-center gap-3 transition-all`}
                                 >
                                   <div className="w-8 h-8 flex-shrink-0 rounded-full bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 flex items-center justify-center border border-cyan-500/30 text-cyan-400 font-bold text-xs">
                                     {s.user?.name?.charAt(0) || '?'}
                                   </div>
                                   <div className="min-w-0 flex-1">
                                     <p className="font-bold text-sm text-white truncate">{s.user?.name || 'Unknown'}</p>
                                     <p className="text-[10px] text-slate-400 truncate flex items-center gap-1 mt-0.5"><Zap className="w-3 h-3 text-emerald-400"/> Synced successfully</p>
                                   </div>
                                 </div>
                               )}
                             </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                ))}
                
              </div>
            </DragDropContext>
          </div>
        )}

      </div>
    </div>
  );
}
