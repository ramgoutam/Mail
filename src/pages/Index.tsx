import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  LogOut,
  ChevronRight,
  ChevronLeft,
  Moon,
  Sun,
  Inbox,
  Send,
  FileText,
  Trash2,
  Search,
  ArrowLeft,
  MoreVertical,
  Reply,
  Forward,
  Settings,
  User,
  Lock,
  LogIn,
  PenSquare,
  X,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Image,
  Link,
  Paperclip,
  Undo,
  Redo,
  Type
} from 'lucide-react';



const Index = () => {
  const [expanded, setExpanded] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [currentFolder, setCurrentFolder] = useState('inbox');
  const [selectedEmailId, setSelectedEmailId] = useState<number | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [editorContent, setEditorContent] = useState('');
  const [isEditorFocused, setIsEditorFocused] = useState(false);
  const [showFontMenu, setShowFontMenu] = useState(false);
  const [selectedFont, setSelectedFont] = useState('Normal');

  interface Email {
    id: number;
    sender: string;
    avatar: string;
    subject: string;
    preview: string;
    time: string;
    folder: string;
    read: boolean;
    body: string;
  }

  const [emails, setEmails] = useState<Email[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('user');
  const [isSignUp, setIsSignUp] = useState(false);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setIsLoggedIn(true);
        fetchUserProfile(session.user.id);
        setSenderEmail(session.user.email || '');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoggedIn(!!session);
      if (session?.user) {
        fetchUserProfile(session.user.id);
        setSenderEmail(session.user.email || '');
      } else {
        setUserRole('user');
        setEmails([]);
        setSenderEmail('');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('role').eq('id', userId).single();
    if (data) {
      setUserRole(data.role);
      if (data.role === 'admin') {
        setDisplayName('Admin');
      }
    }
    fetchEmails(); // Re-fetch emails for the user (rls will handle filtering if applied)
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        alert('Signup successful! Check your email for confirmation (if enabled) or login.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setShowLogoutConfirm(false);
  };


  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const fetchEmails = async () => {
    try {
      const { data, error } = await supabase
        .from('emails')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const mappedEmails: Email[] = data.map((e: any) => ({
          id: e.id,
          sender: e.folder === 'sent' ? (e.recipient_email || 'Recipient') : (e.sender_name || 'Unknown'),
          avatar: (e.sender_name || 'U').split(' ').map((n: any) => n[0]).join('').substring(0, 2).toUpperCase(),
          subject: e.subject || '(No Subject)',
          preview: (e.body || '').substring(0, 80) + '...',
          time: formatTime(e.created_at),
          folder: e.folder || 'inbox',
          read: e.is_read || false,
          body: e.body || ''
        }));
        setEmails(mappedEmails);
      }
    } catch (error) {
      console.error('Error fetching emails:', error);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, []);
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikeThrough: false,
    justifyLeft: false,
    justifyCenter: false,
    justifyRight: false,
    insertUnorderedList: false,
    insertOrderedList: false,
  });
  const [showSizeMenu, setShowSizeMenu] = useState(false);
  const [selectedSize, setSelectedSize] = useState('Normal');
  const [recipients, setRecipients] = useState<string[]>([]);

  const [recipientInput, setRecipientInput] = useState('');
  const [showDomainSuggestions, setShowDomainSuggestions] = useState(false);
  const [matchingDomains, setMatchingDomains] = useState<string[]>([]);
  const [subject, setSubject] = useState('');
  const [displayName, setDisplayName] = useState('Glass Mail');
  const [senderEmail, setSenderEmail] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);

  const COMMON_DOMAINS = [
    'gmail.com', 'outlook.com', 'yahoo.com', 'icloud.com', 'hotmail.com', 'protonmail.com'
  ];

  const FONT_SIZES = [
    { name: 'Small', value: '2' },
    { name: 'Normal', value: '3' },
    { name: 'Large', value: '5' },
    { name: 'Huge', value: '7' },
  ];

  const FONTS = [
    { name: 'Normal', value: 'Inter' },
    { name: 'Serif', value: 'Playfair Display' },
    { name: 'Mono', value: 'Roboto Mono' },
    { name: 'Cursive', value: 'Dancing Script' },
    { name: 'Modern', value: 'Montserrat' },
    { name: 'Elegant', value: 'Great Vibes' },
    { name: 'Typewriter', value: 'Courier Prime' },
    { name: 'Geometric', value: 'Poppins' },
  ];

  const checkFormats = () => {
    setActiveFormats({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      strikeThrough: document.queryCommandState('strikeThrough'),
      justifyLeft: document.queryCommandState('justifyLeft'),
      justifyCenter: document.queryCommandState('justifyCenter'),
      justifyRight: document.queryCommandState('justifyRight'),
      insertUnorderedList: document.queryCommandState('insertUnorderedList'),
      insertOrderedList: document.queryCommandState('insertOrderedList'),
    });
  };

  const handleFormat = (command: string, value: string | undefined = undefined) => {
    // Mutual exclusivity for Underline / Strikethrough
    if (command === 'underline' && activeFormats.strikeThrough) {
      document.execCommand('strikeThrough', false, value);
    }
    if (command === 'strikeThrough' && activeFormats.underline) {
      document.execCommand('underline', false, value);
    }

    document.execCommand(command, false, value);
    editorRef.current?.focus();
    checkFormats();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      document.execCommand(e.shiftKey ? 'outdent' : 'indent');
      checkFormats();
    }
  };



  const addRecipient = (email: string) => {
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      if (!recipients.includes(email)) {
        setRecipients([...recipients, email]);
      }
      setRecipientInput('');
      setShowDomainSuggestions(false);
    }
  };

  const handleRecipientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setRecipientInput(val);

    if (val.includes('@')) {
      const [, domainPart] = val.split('@');
      const matches = COMMON_DOMAINS.filter(d => d.startsWith(domainPart));
      setMatchingDomains(matches);
      setShowDomainSuggestions(matches.length > 0);
    } else {
      setShowDomainSuggestions(false);
    }
  };

  const handleRecipientKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      addRecipient(recipientInput.trim());
    } else if (e.key === 'Backspace' && recipientInput === '' && recipients.length > 0) {
      setRecipients(recipients.slice(0, -1));
    } else if (e.key === 'Tab' && showDomainSuggestions && matchingDomains.length > 0) {
      e.preventDefault();
      const [username] = recipientInput.split('@');
      addRecipient(`${username}@${matchingDomains[0]}`);
    }
  };

  const removeRecipient = (emailToRemove: string) => {
    setRecipients(recipients.filter(email => email !== emailToRemove));
  };

  const handleSendMessage = async () => {
    if (recipients.length === 0) {
      alert('Please add at least one recipient');
      return;
    }
    if (!subject.trim()) {
      alert('Please add a subject');
      return;
    }
    if (!editorContent.trim()) {
      alert('Please add a message body');
      return;
    }

    try {
      // Assuming the worker runs on port 8787
      // Production Worker URL
      const response = await fetch('https://mail-backend.ramgoutam17.workers.dev/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipients.join(', '),
          subject,
          html: editorRef.current?.innerHTML || editorContent,
          fromName: displayName,
          fromEmail: senderEmail
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Message sent successfully!');

        // Insert into Supabase
        const { error: dbError } = await supabase.from('emails').insert({
          sender_name: displayName,
          sender_email: senderEmail,
          recipient_email: recipients.join(', '),
          subject: subject,
          body: editorRef.current?.innerHTML || editorContent,
          folder: 'sent',
          is_read: true,
          user_id: user?.id
        });

        // ---------------------------------------------------------
        // SIMULATION: Loopback for Self-Sending (To see in Inbox)
        // If you send an email to yourself, it should appear in Inbox.
        // ---------------------------------------------------------
        const isSelfSend = recipients.some(r =>
          r.toLowerCase() === senderEmail.toLowerCase() ||
          r.toLowerCase() === user?.email?.toLowerCase()
        );

        if (isSelfSend) {
          await supabase.from('emails').insert({
            sender_name: displayName,
            sender_email: senderEmail,
            recipient_email: recipients.join(', '),
            subject: subject,
            body: editorRef.current?.innerHTML || editorContent,
            folder: 'inbox', // <--- goes to Inbox
            is_read: false,
            user_id: user?.id
          });
        }
        // ---------------------------------------------------------

        if (dbError) {
          console.error('Error saving to DB:', dbError);
        } else {
          fetchEmails();
        }

        setIsComposeOpen(false);
        // Reset form
        setRecipients([]);
        setSubject('');
        setEditorContent('');
        if (editorRef.current) editorRef.current.innerHTML = '';
      } else {
        throw new Error((data as any).error?.message || (data as any).error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message: ' + (error as Error).message);
    }
  };

  const activeButton = (isActive: boolean) =>
    `p-2 rounded transition-colors ${isActive
      ? (darkMode ? 'bg-white text-black' : 'bg-black text-white')
      : `hover:bg-white/10 ${textSecondary} hover:${textPrimary}`}`;

  const filteredEmails = emails.filter(email => email.folder === currentFolder);
  const selectedEmail = emails.find(email => email.id === selectedEmailId);

  // Common Styles
  const glassPanel = `
    backdrop-blur-3xl border shadow-[0_8px_32px_0_rgba(0,0,0,0.36)]
    transition-all duration-500
    ${darkMode
      ? 'bg-white/[0.07] border-white/20 hover:bg-white/[0.1] hover:border-white/30'
      : 'bg-black/[0.05] border-black/10 hover:bg-black/[0.1] hover:border-black/20'
    }
  `;

  const textPrimary = darkMode ? 'text-white' : 'text-slate-800';
  const textSecondary = darkMode ? 'text-white/50' : 'text-slate-500';
  const hoverBg = darkMode ? 'hover:bg-white/10' : 'hover:bg-black/5';

  return (
    <div className={`h-screen w-full relative overflow-hidden flex p-4 gap-4 transition-colors duration-700 ${darkMode ? 'bg-black' : 'bg-slate-100'}`}>
      {/* Background gradients */}
      <div className={`absolute inset-0 w-full h-full -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] transition-opacity duration-700 ${darkMode ? 'from-slate-900 via-[#0a0a0a] to-black opacity-100' : 'from-slate-200 via-white to-slate-100 opacity-50'}`} />

      {/* Background Orbs */}
      <div className={`absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] max-w-[600px] max-h-[600px] rounded-full blur-[100px] mix-blend-screen animate-pulse duration-[10000ms] ${darkMode ? 'bg-indigo-500/30' : 'bg-indigo-400/40'}`} />
      <div className={`absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] max-w-[600px] max-h-[600px] rounded-full blur-[100px] mix-blend-screen animate-pulse delay-1000 duration-[12000ms] ${darkMode ? 'bg-rose-500/20' : 'bg-rose-400/30'}`} />
      <div className={`absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[50vw] h-[50vw] max-w-[800px] max-h-[800px] rounded-full blur-[120px] mix-blend-screen ${darkMode ? 'bg-blue-600/10' : 'bg-blue-400/20'}`} />

      {/* Login View */}
      {/* Login / Signup View */}
      {!isLoggedIn && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-md p-8 rounded-[2rem] flex flex-col items-center gap-6 ${glassPanel} border-white/20 shadow-2xl animate-in fade-in zoom-in-95 duration-500`}>

            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-500 to-rose-500 flex items-center justify-center shadow-lg mb-2">
              {isSignUp ? <User size={40} className="text-white ml-2" /> : <LogIn size={40} className="text-white ml-2" />}
            </div>

            <div className="text-center">
              <h1 className={`text-3xl font-bold mb-2 ${textPrimary}`}>{isSignUp ? 'Create Account' : 'Welcome Back'}</h1>
              <p className={textSecondary}>{isSignUp ? 'Sign up to get started' : 'Please enter your details to sign in.'}</p>
            </div>

            <form onSubmit={handleAuth} className="w-full flex flex-col gap-4">
              <div className={`flex items-center gap-3 h-14 px-4 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-black/5'} border border-transparent focus-within:border-white/20 transition-all`}>
                <User size={20} className={textSecondary} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email Address"
                  className={`flex-1 bg-transparent border-none outline-none ${textPrimary} placeholder:${textSecondary}`}
                  required
                />
              </div>
              <div className={`flex items-center gap-3 h-14 px-4 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-black/5'} border border-transparent focus-within:border-white/20 transition-all`}>
                <Lock size={20} className={textSecondary} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className={`flex-1 bg-transparent border-none outline-none ${textPrimary} placeholder:${textSecondary}`}
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full h-14 rounded-xl bg-gradient-to-r from-indigo-500 to-rose-500 text-white font-bold text-lg shadow-lg hover:opacity-90 transition-opacity mt-2 flex items-center justify-center gap-2"
              >
                {isSignUp ? 'Sign Up' : 'Sign In'}
              </button>
            </form>

            <div className="text-center mt-2">
              <span className={`text-sm ${textSecondary}`}>{isSignUp ? 'Already have an account? ' : "Don't have an account? "}</span>
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className={`text-sm font-bold cursor-pointer hover:underline ${textPrimary}`}
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Main App (Sidebar + Content) */}
      {isLoggedIn && (
        <>
          {/* Logout Confirmation Modal */}
          {showLogoutConfirm && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in fade-in duration-300">
              <div className={`w-full max-w-sm p-6 rounded-[2rem] flex flex-col items-center gap-4 ${glassPanel} border-white/20 shadow-2xl animate-in zoom-in-95 duration-300`}>
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-2">
                  <LogOut size={32} className="text-red-500" />
                </div>
                <div className="text-center">
                  <h2 className={`text-xl font-bold mb-2 ${textPrimary}`}>Confirm Logout</h2>
                  <p className={textSecondary}>Are you sure you want to end your session?</p>
                </div>
                <div className="flex w-full gap-3 mt-2">
                  <button
                    onClick={() => setShowLogoutConfirm(false)}
                    className={`flex-1 h-12 rounded-xl border ${darkMode ? 'border-white/10 hover:bg-white/5' : 'border-black/5 hover:bg-black/5'} transition-colors ${textPrimary} font-medium`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex-1 h-12 rounded-xl bg-red-500 text-white font-medium shadow-lg hover:bg-red-600 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Compose Modal */}
          {/* Compose Modal */}
          {isComposeOpen && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in fade-in duration-300">
              <div className={`w-full max-w-5xl h-[85vh] rounded-[2rem] flex flex-col ${glassPanel} ${darkMode ? 'border-white/20' : 'border-black/10'} ${!darkMode ? 'bg-white/80 hover:bg-white/80' : ''} shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden`}>

                {/* Toolbar Header */}
                <div className={`h-16 flex items-center justify-between px-6 border-b ${darkMode ? 'border-white/10' : 'border-black/5'} shrink-0`}>
                  <span className={`text-lg font-medium ${textPrimary}`}>New Message</span>
                  <button
                    onClick={() => setIsComposeOpen(false)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors ${textSecondary} hover:${textPrimary}`}
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Form */}
                <div className="flex-1 flex flex-col p-6 gap-4 overflow-y-auto">
                  <div className={`flex items-center gap-3 border-b ${darkMode ? 'border-white/10' : 'border-black/5'} pb-2 flex-wrap`}>
                    <span className={`w-12 text-sm font-medium ${textSecondary} shrink-0`}>To:</span>
                    <div className="flex-1 flex flex-wrap gap-2 items-center relative">
                      {recipients.map((email) => (
                        <div key={email} className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm animate-in zoom-in-50 duration-200 ${darkMode ? 'bg-white/10 text-white' : 'bg-black/10 text-black'}`}>
                          <span>{email}</span>
                          <button onClick={() => removeRecipient(email)} className="hover:text-red-400 transition-colors ml-1">
                            <X size={14} />
                          </button>
                        </div>
                      ))}

                      <div className="relative flex-1 min-w-[120px]">
                        <input
                          type="text"
                          value={recipientInput}
                          onChange={handleRecipientChange}
                          onKeyDown={handleRecipientKeyDown}
                          className={`w-full bg-transparent border-none outline-none ${textPrimary} placeholder:${textSecondary}`}
                          placeholder={recipients.length === 0 ? "Recipient's Email" : ""}
                        />
                        {showDomainSuggestions && (
                          <div className={`absolute top-full left-0 mt-1 flex flex-col min-w-[200px] rounded-xl overflow-hidden z-[100] border ${darkMode ? 'border-white/20' : 'border-black/10'} shadow-2xl backdrop-blur-3xl ${darkMode ? 'bg-black/50' : 'bg-white/50'}`}>
                            {matchingDomains.map(domain => (
                              <button
                                key={domain}
                                onClick={() => {
                                  const [username] = recipientInput.split('@');
                                  addRecipient(`${username}@${domain}`);
                                }}
                                className={`text-left px-4 py-2 hover:bg-white/20 ${textPrimary} transition-colors text-sm`}
                              >
                                @{domain}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className={`flex items-center gap-3 border-b ${darkMode ? 'border-white/10' : 'border-black/5'} pb-2`}>
                    <span className={`w-12 text-sm font-medium ${textSecondary}`}>Subject:</span>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className={`flex-1 bg-transparent border-none outline-none font-medium ${textPrimary}`}
                      placeholder="Subject"
                    />
                  </div>
                  <div className="relative flex-1 min-h-[200px]">
                    <div
                      ref={editorRef}
                      contentEditable
                      onInput={(e) => setEditorContent(e.currentTarget.textContent || '')}
                      onFocus={() => setIsEditorFocused(true)}
                      onBlur={() => setIsEditorFocused(false)}
                      onKeyDown={handleKeyDown}
                      onKeyUp={checkFormats}
                      onMouseUp={checkFormats}
                      onClick={checkFormats}
                      className={`w-full h-full bg-transparent border-none outline-none resize-none p-2 leading-relaxed ${textPrimary} font-sans text-lg overflow-y-auto focus:outline-none rich-text-editor`}
                      suppressContentEditableWarning={true}
                    />
                    {!editorContent && !isEditorFocused && (
                      <div className={`absolute top-2 left-2 pointer-events-none ${darkMode ? 'text-white/50' : 'text-gray-400'} text-lg`}>
                        Write your message here...
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer / Toolbar */}
                <div className={`flex flex-col border-t ${darkMode ? 'border-white/10 bg-white/5' : 'border-black/5 bg-black/5'} shrink-0`}>
                  {/* Formatting Toolbar Row */}
                  <div className={`flex items-center gap-1 p-2 px-6 border-b ${darkMode ? 'border-white/5' : 'border-black/5'} flex-wrap`}>

                    {/* Undo/Redo */}
                    <div className={`flex items-center gap-1 pr-3 border-r ${darkMode ? 'border-white/10' : 'border-black/10'}`}>
                      <button onMouseDown={(e) => { e.preventDefault(); handleFormat('undo'); }} className={`p-2 rounded hover:bg-white/10 ${textSecondary} hover:${textPrimary}`}><Undo size={18} /></button>
                      <button onMouseDown={(e) => { e.preventDefault(); handleFormat('redo'); }} className={`p-2 rounded hover:bg-white/10 ${textSecondary} hover:${textPrimary}`}><Redo size={18} /></button>
                    </div>

                    {/* Font Size */}
                    <div className={`relative flex items-center gap-1 px-3 border-r ${darkMode ? 'border-white/10' : 'border-black/10'}`}>
                      <button
                        onMouseDown={(e) => { e.preventDefault(); setShowSizeMenu(!showSizeMenu); }}
                        className={`flex items-center gap-1 p-2 rounded hover:bg-white/10 ${textSecondary} hover:${textPrimary}`}
                      >
                        <span className="font-bold text-lg">T</span>
                        <span className="text-sm font-medium ml-1 w-12 truncate text-left">{selectedSize}</span>
                        <ChevronRight size={14} className={`transform transition-transform ${showSizeMenu ? '-rotate-90' : ''}`} />
                      </button>

                      {/* Font Size Menu */}
                      {showSizeMenu && (
                        <div className={`absolute bottom-full left-0 mb-2 p-2 rounded-xl flex flex-col gap-1 min-w-[100px] z-50 ${glassPanel} border-white/20 shadow-xl`}>
                          {FONT_SIZES.map(size => (
                            <button
                              key={size.name}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleFormat('fontSize', size.value);
                                setSelectedSize(size.name);
                                setShowSizeMenu(false);
                              }}
                              className={`text-left px-3 py-2 rounded-lg hover:bg-white/20 ${textPrimary} transition-colors text-base`}
                            >
                              {size.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Font */}
                    <div className={`relative flex items-center gap-1 px-3 border-r ${darkMode ? 'border-white/10' : 'border-black/10'}`}>
                      <button
                        onMouseDown={(e) => { e.preventDefault(); setShowFontMenu(!showFontMenu); }}
                        className={`flex items-center gap-1 p-2 rounded hover:bg-white/10 ${textSecondary} hover:${textPrimary}`}
                      >
                        <Type size={18} />
                        <span className="text-sm font-medium ml-1 w-20 truncate text-left">{selectedFont}</span>
                        <ChevronRight size={14} className={`transform transition-transform ${showFontMenu ? '-rotate-90' : ''}`} />
                      </button>

                      {/* Font Menu Dropdown */}
                      {showFontMenu && (
                        <div className={`absolute bottom-full left-0 mb-2 p-2 rounded-xl flex flex-col gap-1 min-w-[160px] z-50 ${glassPanel} border-white/20 shadow-xl`}>
                          {FONTS.map(font => (
                            <button
                              key={font.name}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleFormat('fontName', font.value);
                                setSelectedFont(font.name);
                                setShowFontMenu(false);
                              }}
                              className={`text-left px-3 py-2 rounded-lg hover:bg-white/20 ${textPrimary} transition-colors text-base`}
                              style={{ fontFamily: font.value }}
                            >
                              {font.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Style */}
                    <div className={`flex items-center gap-1 px-3 border-r ${darkMode ? 'border-white/10' : 'border-black/10'}`}>
                      <button onMouseDown={(e) => { e.preventDefault(); handleFormat('bold'); }} className={`${activeButton(activeFormats.bold)} font-bold`}><Bold size={18} /></button>
                      <button onMouseDown={(e) => { e.preventDefault(); handleFormat('italic'); }} className={`${activeButton(activeFormats.italic)} italic`}><Italic size={18} /></button>
                      <button onMouseDown={(e) => { e.preventDefault(); handleFormat('underline'); }} className={`${activeButton(activeFormats.underline)} underline`}><Underline size={18} /></button>
                      <button onMouseDown={(e) => { e.preventDefault(); handleFormat('strikeThrough'); }} className={`${activeButton(activeFormats.strikeThrough)} line-through`}><Strikethrough size={18} /></button>
                    </div>

                    {/* Align */}
                    <div className={`flex items-center gap-1 px-3 border-r ${darkMode ? 'border-white/10' : 'border-black/10'}`}>
                      <button onMouseDown={(e) => { e.preventDefault(); handleFormat('justifyLeft'); }} className={activeButton(activeFormats.justifyLeft)}><AlignLeft size={18} /></button>
                      <button onMouseDown={(e) => { e.preventDefault(); handleFormat('justifyCenter'); }} className={activeButton(activeFormats.justifyCenter)}><AlignCenter size={18} /></button>
                      <button onMouseDown={(e) => { e.preventDefault(); handleFormat('justifyRight'); }} className={activeButton(activeFormats.justifyRight)}><AlignRight size={18} /></button>
                    </div>

                    {/* Lists */}
                    <div className={`flex items-center gap-1 px-3 border-r ${darkMode ? 'border-white/10' : 'border-black/10'}`}>
                      <button onMouseDown={(e) => { e.preventDefault(); handleFormat('insertUnorderedList'); }} className={activeButton(activeFormats.insertUnorderedList)}><List size={18} /></button>
                      <button onMouseDown={(e) => { e.preventDefault(); handleFormat('insertOrderedList'); }} className={activeButton(activeFormats.insertOrderedList)}><ListOrdered size={18} /></button>
                    </div>

                    {/* Insert */}
                    <div className="flex items-center gap-1 pl-3">
                      <button onMouseDown={(e) => { e.preventDefault(); const url = prompt('Enter URL:'); if (url) handleFormat('createLink', url); }} className={`p-2 rounded hover:bg-white/10 ${textSecondary} hover:${textPrimary}`}><Link size={18} /></button>
                      <button onMouseDown={(e) => { e.preventDefault(); const url = prompt('Enter Image URL:'); if (url) handleFormat('insertImage', url); }} className={`p-2 rounded hover:bg-white/10 ${textSecondary} hover:${textPrimary}`}><Image size={18} /></button>
                      <button className={`p-2 rounded hover:bg-white/10 ${textSecondary} hover:${textPrimary}`}><Paperclip size={18} /></button>
                    </div>
                  </div>

                  {/* Action Row */}
                  <div className="h-16 flex items-center justify-between px-6">
                    <button className={`text-sm ${textSecondary} hover:${textPrimary} hover:underline`}>
                      Save as draft
                    </button>
                    <div className="flex items-center gap-4">
                      <button className={`p-2 rounded-full hover:bg-red-500/10 ${textSecondary} hover:text-red-500 transition-colors`}><Trash2 size={20} /></button>
                      <button
                        onClick={handleSendMessage}
                        className="px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-rose-500 text-white font-bold shadow-lg hover:opacity-90 hover:scale-[1.02] transition-all flex items-center gap-2"
                      >
                        <Send size={18} />
                        <span>Send Message</span>
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}



          {/* Sidebar */}
          <div className={`h-full flex flex-col gap-4 z-10 transition-all duration-500 ease-in-out ${expanded ? 'w-64' : 'w-16'}`}>

            {/* Avatar */}
            <div
              onClick={() => {
                setCurrentFolder('profile');
                setSelectedEmailId(null);
              }}
              className={`w-full h-16 rounded-[2rem] flex items-center cursor-pointer overflow-hidden ${glassPanel}`}
            >
              <div className="w-16 h-full flex items-center justify-center shrink-0">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500/50 to-rose-500/50 flex items-center justify-center">
                  <span className="text-white text-xs font-medium">{user?.email?.substring(0, 2).toUpperCase() || 'JD'}</span>
                </div>
              </div>
              <div className={`flex flex-col justify-center overflow-hidden whitespace-nowrap transition-all duration-500 ${expanded ? 'opacity-100 max-w-[200px]' : 'opacity-0 max-w-0'}`}>
                <span className={`font-medium pl-2 ${textPrimary}`}>{displayName}</span>
                <span className={`text-xs pl-2 ${textSecondary}`}>{userRole === 'admin' ? 'Admin User' : 'Standard User'}</span>
              </div>
            </div>

            {/* Navigation Pill */}
            <div className={`w-full flex-1 rounded-[2rem] flex flex-col relative overflow-hidden ${glassPanel}`}>

              {/* Folder Nav Items */}
              <div className="flex flex-col gap-2 pt-2 w-full px-2">
                {/* Compose Button */}
                <button
                  onClick={() => setIsComposeOpen(true)}
                  className={`
                      h-12 w-full rounded-3xl flex items-center transition-all duration-500 ease-in-out
                      bg-gradient-to-r from-indigo-500/10 to-rose-500/10 hover:from-indigo-500/20 hover:to-rose-500/20 
                      border border-white/5 group
                   `}
                >
                  <div className="w-12 h-12 flex items-center justify-center shrink-0 text-indigo-500">
                    <PenSquare size={20} />
                  </div>
                  <span className={`font-bold pl-1 transition-all duration-500 overflow-hidden whitespace-nowrap ${textPrimary} ${expanded ? 'max-w-[200px] opacity-100' : 'max-w-0 opacity-0'}`}>
                    Compose
                  </span>
                </button>
                <div className={`h-px w-full my-1 ${darkMode ? 'bg-white/10' : 'bg-black/5'}`} />

                {[
                  { id: 'inbox', icon: Inbox, label: 'Inbox' },
                  { id: 'sent', icon: Send, label: 'Sent' },
                  { id: 'drafts', icon: FileText, label: 'Drafts' },
                  { id: 'trash', icon: Trash2, label: 'Trash' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentFolder(item.id);
                      setSelectedEmailId(null);
                    }}
                    className={`
                   h-12 w-full rounded-3xl flex items-center transition-all duration-500 ease-in-out
                   ${currentFolder === item.id ? (darkMode ? 'bg-white/20' : 'bg-black/10') : 'hover:bg-white/5'}
                 `}
                  >
                    {/* Icon Container - Fixed width to align with other sidebar elements */}
                    <div className="w-12 h-12 flex items-center justify-center shrink-0">
                      <item.icon size={20} className={`${currentFolder === item.id ? textPrimary : textSecondary}`} />
                    </div>

                    {/* Label */}
                    <span className={`font-medium transition-all duration-500 overflow-hidden whitespace-nowrap pl-1 ${textPrimary} ${expanded ? 'max-w-[200px] opacity-100' : 'max-w-0 opacity-0'}`}>
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>

              {/* Bottom Controls */}
              <div className="mt-auto w-full flex flex-col items-center pb-2 gap-2">
                {/* Settings */}
                <button
                  onClick={() => {
                    setCurrentFolder('settings');
                    setSelectedEmailId(null);
                  }}
                  className={`h-12 rounded-full transition-all duration-500 ease-in-out flex items-center overflow-hidden ${hoverBg} ${textSecondary} hover:${textPrimary} ${expanded ? 'w-[calc(100%-1rem)]' : 'w-12'}`}
                >
                  <div className="w-12 h-12 flex items-center justify-center shrink-0">
                    <Settings size={20} />
                  </div>
                  <div className={`overflow-hidden whitespace-nowrap transition-all duration-500 flex items-center ${expanded ? 'max-w-[200px] opacity-100' : 'max-w-0 opacity-0'}`}>
                    <span className="font-medium pl-1">Settings</span>
                  </div>
                </button>

                {/* Theme Toggle */}
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`h-12 rounded-full transition-all duration-500 ease-in-out flex items-center overflow-hidden ${hoverBg} ${textSecondary} hover:${textPrimary} ${expanded ? 'w-[calc(100%-1rem)]' : 'w-12'}`}
                >
                  <div className="w-12 h-12 flex items-center justify-center shrink-0">
                    {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                  </div>
                  <div className={`overflow-hidden whitespace-nowrap transition-all duration-500 flex items-center ${expanded ? 'max-w-[200px] opacity-100' : 'max-w-0 opacity-0'}`}>
                    <span className="font-medium pl-1">{darkMode ? 'Light' : 'Dark'} Mode</span>
                  </div>
                </button>

                {/* Expand Toggle */}
                <button
                  onClick={() => setExpanded(!expanded)}
                  className={`h-12 rounded-full transition-all duration-500 ease-in-out flex items-center overflow-hidden ${hoverBg} ${textSecondary} hover:${textPrimary} ${expanded ? 'w-[calc(100%-1rem)]' : 'w-12'}`}
                >
                  <div className="w-12 h-12 flex items-center justify-center shrink-0">
                    {expanded ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                  </div>
                  <div className={`overflow-hidden whitespace-nowrap transition-all duration-500 flex items-center ${expanded ? 'max-w-[200px] opacity-100' : 'max-w-0 opacity-0'}`}>
                    <span className="font-medium pl-1">Collapse</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className={`w-full h-16 rounded-[2rem] flex items-center overflow-hidden ${glassPanel} ${textSecondary} hover:${textPrimary}`}
            >
              <div className="w-16 h-full flex items-center justify-center shrink-0">
                <LogOut size={24} />
              </div>
              <span className={`font-medium overflow-hidden whitespace-nowrap transition-all duration-500 pl-2 ${expanded ? 'opacity-100 max-w-[200px]' : 'opacity-0 max-w-0'}`}>
                Logout
              </span>
            </button>
          </div>

          {/* Main Content Area */}
          <div className={`flex-1 h-full relative rounded-[2rem] overflow-hidden flex flex-col z-10 ${glassPanel}`}>

            {/* Header / Search Bar */}
            <div className={`h-20 w-full flex items-center justify-between px-6 border-b ${darkMode ? 'border-white/10' : 'border-black/5'}`}>
              {/* Page Title */}
              <h1
                key={currentFolder}
                className={`text-xl md:text-2xl font-bold tracking-wide capitalize ${textPrimary} animate-in fade-in slide-in-from-left-4 duration-500`}
              >
                {currentFolder}
              </h1>

              <div
                className={`
              flex items-center h-12 rounded-full transition-all duration-500 ease-in-out cursor-pointer max-w-md
              ${isSearchOpen ? 'w-full bg-white/5 pr-4' : 'w-12 bg-transparent hover:bg-white/10'}
              ${darkMode ? (isSearchOpen ? 'bg-white/10' : '') : (isSearchOpen ? 'bg-black/5' : '')}
            `}
                onClick={() => {
                  if (!isSearchOpen) {
                    setIsSearchOpen(true);
                  }
                }}
              >
                {/* Search Icon Container - Always 12x12 centered */}
                <div
                  className="w-12 h-12 flex items-center justify-center shrink-0"
                  onClick={(e) => {
                    if (isSearchOpen) {
                      e.stopPropagation();
                      setIsSearchOpen(false);
                    }
                  }}
                >
                  <Search size={20} className={textSecondary} />
                </div>

                <input
                  type="text"
                  placeholder="Search emails..."
                  className={`
                bg-transparent border-none outline-none overflow-hidden whitespace-nowrap
                transition-all duration-500 ease-in-out
                ${textPrimary} placeholder:${textSecondary}
                ${isSearchOpen ? 'w-full opacity-100 pl-0' : 'w-0 opacity-0 pl-0'}
              `}
                  onBlur={() => setIsSearchOpen(false)}
                />
              </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-4">

              {currentFolder === 'settings' ? (
                // SETTINGS VIEW
                <div className="max-w-3xl mx-auto pt-8 animate-in fade-in zoom-in-95 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Account Section */}
                    {/* Profile Settings (was Account) */}
                    <div className={`p-6 rounded-3xl flex flex-col gap-4 ${glassPanel} !bg-white/5`}>
                      <h3 className={`text-xl font-bold ${textPrimary} flex items-center gap-2`}>
                        <div className="p-2 rounded-full bg-blue-500/20 text-blue-500"><User size={18} /></div>
                        Profile Settings
                      </h3>
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1">
                          <label className={`text-sm font-medium ${textSecondary} ml-1`}>Display Name</label>
                          <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className={`w-full p-3 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-white/20 transition-colors ${textPrimary}`}
                            placeholder="Your Name"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className={`text-sm font-medium ${textSecondary} ml-1`}>Sender Email</label>
                          <input
                            type="text"
                            value={senderEmail}
                            onChange={(e) => setSenderEmail(e.target.value)}
                            className={`w-full p-3 rounded-xl bg-white/5 border border-white/10 outline-none focus:border-white/20 transition-colors ${textPrimary}`}
                            placeholder="test@yourdomain.com"
                          />
                        </div>
                      </div>
                    </div>

                    {/* General Section */}
                    <div className={`p-6 rounded-3xl flex flex-col gap-4 ${glassPanel} !bg-white/5`}>
                      <h3 className={`text-xl font-bold ${textPrimary} flex items-center gap-2`}>
                        <div className="p-2 rounded-full bg-emerald-500/20 text-emerald-500"><Settings size={18} /></div>
                        General
                      </h3>
                      <div className="flex flex-col gap-1">
                        <button className={`w-full text-left p-3 rounded-xl hover:bg-white/5 transition-colors ${textSecondary} hover:${textPrimary}`}>
                          Language & Region
                        </button>
                        <button className={`w-full text-left p-3 rounded-xl hover:bg-white/5 transition-colors ${textSecondary} hover:${textPrimary}`}>
                          Data Usage
                        </button>
                        <button className={`w-full text-left p-3 rounded-xl hover:bg-white/5 transition-colors ${textSecondary} hover:${textPrimary}`}>
                          Accessibility
                        </button>
                      </div>
                    </div>

                    {/* About Section */}
                    <div className={`col-span-1 md:col-span-2 p-6 rounded-3xl flex flex-col gap-4 ${glassPanel} !bg-white/5`}>
                      <h3 className={`text-xl font-bold ${textPrimary}`}>About</h3>
                      <div className="flex items-center justify-between">
                        <span className={textSecondary}>Version</span>
                        <span className={textPrimary}>1.0.0 (Beta)</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={textSecondary}>Terms of Service</span>
                        <span className={`${textPrimary} underline cursor-pointer`}>View</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : currentFolder === 'profile' ? (
                // PROFILE VIEW
                <div className={`flex flex-col gap-8 max-w-2xl mx-auto pt-10 animate-in fade-in slide-in-from-bottom-8 duration-500`}>
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-indigo-500/50 to-rose-500/50 flex items-center justify-center text-4xl text-white font-medium shadow-xl">
                      JD
                    </div>
                    <div className="text-center">
                      <h2 className={`text-3xl font-bold ${textPrimary}`}>{displayName}</h2>
                      <p className={`${textSecondary}`}>{user?.email}</p>
                      {userRole === 'admin' && (
                        <span className="inline-block mt-2 px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-full text-sm font-medium border border-indigo-500/20">
                          Admin Access
                        </span>
                      )}
                    </div>
                  </div>

                  <div className={`p-6 rounded-3xl flex flex-col gap-4 ${glassPanel} !bg-white/5`}>
                    <h3 className={`text-lg font-medium ${textPrimary}`}>Preferences</h3>

                    <div className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
                      <span className={textPrimary}>Email Notifications</span>
                      <div className={`w-11 h-6 rounded-full relative transition-colors ${darkMode ? 'bg-indigo-500' : 'bg-slate-300'}`}>
                        <div className="absolute right-1 top-1 w-4 h-4 rounded-full bg-white shadow-sm" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
                      <span className={textPrimary}>Sound Effects</span>
                      <div className={`w-11 h-6 rounded-full relative transition-colors ${darkMode ? 'bg-slate-700' : 'bg-slate-300'}`}>
                        <div className="absolute left-1 top-1 w-4 h-4 rounded-full bg-white shadow-sm" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
                      <span className={textPrimary}>Compact View</span>
                      <div className={`w-11 h-6 rounded-full relative transition-colors ${darkMode ? 'bg-slate-700' : 'bg-slate-300'}`}>
                        <div className="absolute left-1 top-1 w-4 h-4 rounded-full bg-white shadow-sm" />
                      </div>
                    </div>
                  </div>
                </div>
              ) : selectedEmail ? (
                // EMAIL DETAIL VIEW
                <div className={`h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-300`}>
                  {/* Toolbar */}
                  <div className="flex items-center gap-4 mb-6">
                    <button onClick={() => setSelectedEmailId(null)} className={`p-2 rounded-full ${hoverBg} ${textPrimary}`}>
                      <ArrowLeft size={20} />
                    </button>
                    <div className="flex-1" />
                    <button className={`p-2 rounded-full ${hoverBg} ${textSecondary} hover:${textPrimary}`}><Reply size={20} /></button>
                    <button className={`p-2 rounded-full ${hoverBg} ${textSecondary} hover:${textPrimary}`}><Forward size={20} /></button>
                    <button className={`p-2 rounded-full ${hoverBg} ${textSecondary} hover:${textPrimary}`}><Trash2 size={20} /></button>
                    <button className={`p-2 rounded-full ${hoverBg} ${textSecondary} hover:${textPrimary}`}><MoreVertical size={20} /></button>
                  </div>

                  {/* Header */}
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h1 className={`text-2xl md:text-3xl font-light mb-2 ${textPrimary}`}>{selectedEmail.subject}</h1>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${darkMode ? 'bg-white/20 text-white' : 'bg-black/10 text-black'}`}>
                          {selectedEmail.avatar}
                        </div>
                        <div className="flex flex-col">
                          <span className={`text-sm font-medium ${textPrimary}`}>{selectedEmail.sender}</span>
                          <span className={`text-xs ${textSecondary}`}>to me</span>
                        </div>
                      </div>
                    </div>
                    <span className={`text-sm ${textSecondary}`}>{selectedEmail.time}</span>
                  </div>

                  {/* Body */}
                  <div className={`flex-1 ${textPrimary} whitespace-pre-line leading-relaxed`}>
                    {selectedEmail.body}
                  </div>
                </div>
              ) : (
                // EMAIL LIST VIEW
                <div className="flex flex-col gap-3">
                  {filteredEmails.length === 0 ? (
                    <div className={`flex flex-col items-center justify-center h-64 ${textSecondary}`}>
                      <Inbox size={48} className="mb-4 opacity-50" />
                      <p>No emails in {currentFolder}</p>
                    </div>
                  ) : (
                    filteredEmails.map((email) => (
                      <div
                        key={email.id}
                        onClick={() => setSelectedEmailId(email.id)}
                        className={`
                      group p-4 rounded-2xl cursor-pointer transition-all duration-300 border
                      ${darkMode
                            ? 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                            : 'bg-white/40 border-white/40 hover:bg-white/60 hover:border-white/60'
                          }
                      flex items-center gap-4
                    `}
                      >
                        <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-medium
                      ${darkMode ? 'bg-white/10 text-white' : 'bg-black/5 text-black'}
                    `}>
                          {email.avatar}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className={`font-medium truncate ${textPrimary} ${!email.read ? 'font-bold' : ''}`}>
                              {email.sender}
                            </span>
                            <span className={`text-xs whitespace-nowrap ${textSecondary}`}>
                              {email.time}
                            </span>
                          </div>
                          <h3 className={`text-sm truncate mb-0.5 ${textSecondary} ${!email.read ? textPrimary : ''}`}>
                            {email.subject}
                          </h3>
                          <p className={`text-xs truncate opacity-70 ${textSecondary}`}>
                            {email.preview}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Index;
