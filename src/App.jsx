import React, { useEffect, useRef, useState } from "react";

// --- Icons (Using Inline SVGs for zero dependencies) ---
const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/>
    <path d="m21.854 2.147-10.94 10.939"/>
  </svg>
);

const TerminalIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
    <polyline points="4 17 10 11 4 5"></polyline>
    <line x1="12" y1="19" x2="20" y2="19"></line>
  </svg>
);

const ChevronRight = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"></polyline>
  </svg>
);

const ChevronDown = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

// --- 1. Header Component ---
const Header = () => (
  <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
    <div className="flex items-center gap-3">
      <div className="flex flex-col">
        <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent tracking-tight">
          Autonomous Python Developer
        </h1>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
          </span>
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Sandbox Active</span>
        </div>
      </div>
    </div>
  </header>
);

// --- 2. Expander (Dropdown) Component ---
const Expander = ({ title, icon: Icon, children, defaultOpen = false, type = 'default' }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const isError = type === 'error';

  return (
    <div className={`mt-2 rounded-lg overflow-hidden border shadow-sm ${isError ? 'border-rose-700/50' : 'border-slate-700'}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3 py-2.5 text-[11px] font-mono tracking-wide transition-colors focus:outline-none
          ${isError ? 'bg-rose-950/80 text-rose-300 hover:bg-rose-900' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}
        `}
      >
        <div className="flex items-center gap-2 truncate pr-4 w-full text-left">
          {Icon && <Icon />}
          <span className="truncate">{title}</span>
        </div>
        <div className="shrink-0 opacity-70">
          {isOpen ? <ChevronDown /> : <ChevronRight />}
        </div>
      </button>
      
      {isOpen && (
        <div className={`p-4 text-xs font-mono overflow-x-auto whitespace-pre-wrap border-t ${isError ? 'bg-rose-950 text-rose-200 border-rose-900/50' : 'bg-slate-900 text-slate-300 border-slate-700'}`}>
          {children}
        </div>
      )}
    </div>
  );
};

// --- 3. ChatBubble Component ---
const ChatBubble = ({ messages }) => (
  <div className="flex flex-col gap-6 w-full">
    {messages.map((msg, index) => {
      const isUser = msg.role === "user";
      
      return (
        <div 
          key={index} 
          className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
        >
          <div 
            className={`
              flex flex-col max-w-[85%] md:max-w-[75%] 
              ${isUser 
                ? 'bg-slate-900 text-white rounded-2xl rounded-tr-sm px-5 py-3.5 shadow-md' 
                : 'bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm'
              }
            `}
          >
            {/* 1. Render Agent Actions (Tools being called) */}
            {msg.type === "action" && Array.isArray(msg.content) ? (
              msg.content.map((tool, idx) => {
                // Dynamically build a clean title based on what the tool is doing
                let title = `Action: ${tool.name}`;
                if (tool.name === "run_terminal" && tool.args?.command) {
                  title = `run_terminal: ${tool.args.command}`;
                } else if (tool.name === "write_file" && tool.args?.file_path) {
                  title = `write_file: ${tool.args.file_path}`;
                }

                return (
                  <Expander key={idx} title={title} icon={TerminalIcon}>
                    {tool.name === "write_file" ? (
                      <div className="text-emerald-400">{tool.args.content}</div>
                    ) : tool.name === "run_terminal" ? (
                      <div className="text-emerald-400">$ {tool.args.command}</div>
                    ) : (
                      <div>{JSON.stringify(tool.args, null, 2)}</div>
                    )}
                  </Expander>
                );
              })
              
            /* 2. Render Tool Results (Outputs/Success Messages) */
            ) : msg.type === "tool_result" ? (
              <Expander
                title={`Result: ${msg.name || 'System'}`}
                icon={TerminalIcon}
                type={msg.content?.includes?.('ERROR') || msg.content?.includes?.('FAILED') ? 'error' : 'default'}
              >
                {msg.content}
              </Expander>
              
            /* 3. Fallback for unexpected objects */
            ) : typeof msg.content === "object" ? (
              <Expander title="System Data" icon={TerminalIcon}>
                 {JSON.stringify(msg.content, null, 2)}
              </Expander>
              
            /* 4. Normal Conversational Text */
            ) : (
              <span className="text-[15px] leading-relaxed whitespace-pre-wrap">
                {msg.content}
              </span>
            )}
            
          </div>
        </div>
      );
    })}
  </div>
);

// --- 4. Input Component ---
const Input = ({ handleSend, inputMessage, setInputMessage }) => (
  <div className="sticky bottom-0 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent pt-6 pb-6 px-4 md:px-0">
    <form onSubmit={handleSend} className="max-w-3xl mx-auto relative flex items-center shadow-lg rounded-2xl bg-white border border-slate-200 focus-within:ring-2 focus-within:ring-slate-900 focus-within:border-transparent transition-all">
      <input 
        value={inputMessage}
        onChange={(e) => setInputMessage(e.target.value)} 
        placeholder="Ask the agent to build something..." 
        className="flex-1 bg-transparent text-slate-800 px-6 py-4 outline-none placeholder:text-slate-400 text-sm md:text-base rounded-l-2xl" 
      />
      <button 
        type="submit"
        disabled={!inputMessage.trim()}
        className="p-3 mr-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl transition-colors flex items-center justify-center focus:outline-none"
      >
        <SendIcon />
      </button>
    </form>
  </div>
);
  
// --- 5. Main App Container ---
export default function App() {
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState([]);
  
  // Auto-scroller
  const messagesEndRef = useRef(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Main chat logic
  const handleSend = async (e) => {
    e.preventDefault();
    const userMessage = inputMessage;
    
    if (!inputMessage.trim()) return;
    
    setMessages((prev) => [...prev, {
      "role": "user",
      "content": userMessage
    }]);
    
    setInputMessage('');
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chat`, {
        method : "POST",
        headers : {"content-type": "application/json"},
        body : JSON.stringify({ message: userMessage })
      });
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      // Stream processing loop
      while(true) {
        const { done, value } = await reader.read();
        if (done) break; 
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');

        buffer = lines.pop(); // Keep incomplete lines in the buffer

        for(const line of lines) {
          if(line.startsWith("data: ")) {
            const data_str = line.replace("data: ", "").trim();

            try {
              const data = JSON.parse(data_str);
              console.log("Streamed Data:", data);
              
              if (data.type === "tool_result") {
                setMessages((prev) => [...prev, {
                  "role": "assistant",
                  "type": data.type,
                  "content": data.content,
                  "name": data.name // Passed from backend!
                }]);
              } else {
                setMessages((prev) => [...prev, {
                  "role": "assistant",
                  "type": data.type,
                  "content": data.content
                }]);
              }
            } catch (err) {
              console.warn("Skipping unparseable stream chunk:", data_str);
            }
          }
        }
      }
    } catch (error) {
      console.error("AI processing error:", error);
    } 
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans text-slate-900 selection:bg-slate-200">
      <Header />    
      
      <main className="flex-1 overflow-y-auto px-4 py-8 md:px-0 scroll-smooth">
        <div className="max-w-3xl mx-auto flex flex-col min-h-full justify-end">
          
          {/* Welcome Screen */}
          {messages.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-4 opacity-70 my-auto pb-20">
              <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center">
                <TerminalIcon />
              </div>
              <p className="text-lg font-medium tracking-wide">Ready for your instructions</p>
            </div>
          )}  
          
          <ChatBubble messages={messages} />
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </main>

      <Input handleSend={handleSend} inputMessage={inputMessage} setInputMessage={setInputMessage} />
    </div>
  );
}