
import React, { useState, useEffect, useRef } from 'react';
import { User, UserStatus, Message, ChatSession } from './types';
import { STATUS_ICONS, FLOWER_ICON } from './constants';
import { RetroWindow, RetroButton, RetroInput, SunkenContainer } from './components/RetroUI';
import { getBotResponse } from './services/geminiService';

// --- Firebase Imports ---
import { db, auth } from './firebaseConfig';
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  limit,
  setDoc,
  doc,
  serverTimestamp,
  updateDoc,
  getDoc,
  getDocs,
  arrayUnion
} from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

// --- Sound Utility ---
const playUhOh = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(400, ctx.currentTime + 0.15);
    osc.frequency.setValueAtTime(400, ctx.currentTime + 0.2);
    osc.frequency.linearRampToValueAtTime(200, ctx.currentTime + 0.35);

    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) {
    // console.error("Audio failed", e);
  }
};

const playMsgSound = () => {
    try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, ctx.currentTime);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
    } catch(e){}
}

export default function App() {
  // --- State ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loginUin, setLoginUin] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Default contacts (Bots/System)
  const defaultContacts = [
    { uin: '987654', nickname: 'GeminiBot', email: 'ai@google.com', status: UserStatus.ONLINE, isBot: true },
    { uin: '100000', nickname: 'System', email: 'admin@icq.com', status: UserStatus.AWAY, isBot: true },
  ];

  const [contacts, setContacts] = useState<User[]>(defaultContacts);
  const [chatSessions, setChatSessions] = useState<Record<string, ChatSession>>({});
  const [activeWindow, setActiveWindow] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- Firebase Logic ---

  // 1. Auth & Presence Listener
  useEffect(() => {
    // CRITICAL FIX: Do not attempt to listen to users if not logged in locally OR if Firebase Auth isn't ready.
    if (!currentUser) return;
    if (!auth.currentUser) {
        console.warn("Aguardando inicialização do Firebase Auth...");
        return;
    }

    // Simplified query to avoid index errors
    const q = query(collection(db, "users"), limit(50));

    const unsubscribeUsers = onSnapshot(q,
      (snapshot) => {
        const onlineUsers: User[] = [];
        const userContacts = currentUser.contacts || []; // Lista de contatos do usuário

        snapshot.forEach((doc) => {
          const data = doc.data();
          // Don't show myself in the list
          if (currentUser && data.uin === currentUser.uin) return;

          // PRIVACIDADE: Só mostrar usuários que estão na minha lista de contatos
          if (!userContacts.includes(data.uin)) return;

          onlineUsers.push({
            uin: data.uin,
            nickname: data.nickname,
            email: data.email,
            status: data.status as UserStatus,
            isBot: false
          });
        });

        // Merge Firebase users with Bot users
        setContacts([...defaultContacts, ...onlineUsers]);
      },
      (error) => {
        console.error("Erro no Listener de Usuários:", error);
        if (error.code === 'permission-denied') {
            alert("ACESSO NEGADO: Verifique as regras do Firebase Console. Devem estar como 'allow read, write: if true;' para esta demo.");
        }
      }
    );

    return () => unsubscribeUsers();
  }, [currentUser]); // Trigger when local user state changes

  // 2. Message Listener
  useEffect(() => {
    if (!currentUser) return;
    if (!auth.currentUser) return;

    // Simplified query
    const q = query(collection(db, "messages"), limit(100));

    const unsubscribeMessages = onSnapshot(q, 
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const msgData = change.doc.data();
            
            // Only process if it involves me
            if (msgData.receiverUin === currentUser.uin || msgData.senderUin === currentUser.uin) {
              
              const msg: Message = {
                  id: change.doc.id,
                  senderUin: msgData.senderUin,
                  receiverUin: msgData.receiverUin,
                  text: msgData.text,
                  timestamp: msgData.timestamp ? msgData.timestamp.toMillis() : Date.now(),
                  read: true
              };

              // If I received it, play sound
              if (msg.receiverUin === currentUser.uin) {
                  // Determine if it's "new" (to avoid sound on initial load of history)
                  if (Date.now() - msg.timestamp < 2000) {
                      playUhOh();
                  }
                  handleIncomingMessage(msg);
              } else {
                  // It's a message I sent, just sync UI
                  handleIncomingMessage(msg);
              }
            }
          }
        });
      },
      (error) => {
        console.error("Firebase Messages Listener Error:", error);
        // Do not alert here to avoid double alerts, just log.
      }
    );

    return () => unsubscribeMessages();
  }, [currentUser]);

  // Update my status on window close/refresh
  useEffect(() => {
    const handleBeforeUnload = () => {
        if (currentUser && auth.currentUser) {
            const userRef = doc(db, "users", currentUser.uin);
            // Fire and forget
            updateDoc(userRef, { status: UserStatus.OFFLINE }).catch(() => {});
        }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [currentUser]);


  // --- Logic Helpers ---

  const handleIncomingMessage = (msg: Message) => {
     // Identify the "Partner" in this conversation
     const partnerUin = msg.senderUin === currentUser?.uin ? msg.receiverUin : msg.senderUin;
     
     setChatSessions(prev => {
         const existing = prev[partnerUin];
         
         // Avoid duplicates
         if (existing && existing.messages.some(m => m.id === msg.id)) return prev;

         // Sort messages by timestamp since we removed orderBy in query
         const newMessages = existing ? [...existing.messages, msg] : [msg];
         newMessages.sort((a, b) => a.timestamp - b.timestamp);

         const updatedSession = existing 
            ? { ...existing, messages: newMessages, isOpen: true }
            : { contactUin: partnerUin, messages: newMessages, draft: '', isOpen: true, minimized: false };
         
         return { ...prev, [partnerUin]: updatedSession };
     });
     
     // Only force focus window if I received it
     if (!activeWindow && msg.receiverUin === currentUser?.uin) {
         setActiveWindow(partnerUin);
     }
  };

  const handleNewUser = () => {
    setIsRegistering(!isRegistering);
    setLoginUin('');
    setLoginPass('');
  };

  const handleAddContact = async () => {
    if (!currentUser) return;

    const contactEmail = prompt("Digite o email do contato que deseja adicionar:");
    if (!contactEmail || !contactEmail.trim()) return;

    try {
      // Buscar todos os usuários para encontrar o email
      const usersRef = collection(db, "users");
      const q = query(usersRef);
      const snapshot = await getDocs(q);

      let foundContact: any = null;
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.email === contactEmail.trim()) {
          foundContact = { uin: data.uin, nickname: data.nickname, email: data.email };
        }
      });

      if (!foundContact) {
        alert("❌ Usuário não encontrado.\n\nVerifique se o email está correto e se o usuário já criou uma conta.");
        return;
      }

      // Verificar se já é contato
      if (currentUser.contacts?.includes(foundContact.uin)) {
        alert("ℹ️ Este usuário já está na sua lista de contatos.");
        return;
      }

      // Adicionar à lista de contatos
      const userRef = doc(db, "users", currentUser.uin);
      await updateDoc(userRef, {
        contacts: arrayUnion(foundContact.uin)
      });

      // Atualizar estado local
      setCurrentUser({
        ...currentUser,
        contacts: [...(currentUser.contacts || []), foundContact.uin]
      });

      playUhOh();
      alert(`✅ ${foundContact.nickname} foi adicionado aos seus contatos!`);

    } catch (error: any) {
      console.error("Erro ao adicionar contato:", error);
      alert("❌ Erro ao adicionar contato. Tente novamente.");
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação de email
    if (!validateEmail(loginUin)) {
      alert("❌ Por favor, insira um email válido.\n\nExemplo: seu.nome@exemplo.com");
      return;
    }

    // Validação de senha
    if (loginPass.length < 6) {
      alert("❌ A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    try {
        let userCredential;

        if (isRegistering) {
            // MODO REGISTRO - Criar nova conta
            userCredential = await createUserWithEmailAndPassword(auth, loginUin, loginPass);

            // Gerar UIN único baseado no timestamp e ID do usuário
            const uin = userCredential.user.uid.substring(0, 8);
            const nickname = loginUin.split('@')[0];

            const newUser: User = {
                uin: uin,
                nickname: nickname,
                email: loginUin,
                status: UserStatus.ONLINE,
                contacts: [] // Inicializar lista de contatos vazia
            };

            // Salvar dados do usuário no Firestore
            await setDoc(doc(db, "users", uin), {
                ...newUser,
                lastSeen: serverTimestamp()
            });

            playUhOh();
            setCurrentUser(newUser);
            alert("✅ Conta criada com sucesso!\n\nBem-vindo ao ICQ Reloaded!");

        } else {
            // MODO LOGIN - Entrar com conta existente
            userCredential = await signInWithEmailAndPassword(auth, loginUin, loginPass);

            // Buscar dados do usuário no Firestore
            const uin = userCredential.user.uid.substring(0, 8);
            const userRef = doc(db, "users", uin);
            const userDoc = await getDoc(userRef);

            let existingUser: User;

            if (userDoc.exists()) {
                // Usuário já existe, buscar dados completos
                const userData = userDoc.data();
                existingUser = {
                    uin: uin,
                    nickname: userData.nickname || loginUin.split('@')[0],
                    email: loginUin,
                    status: UserStatus.ONLINE,
                    contacts: userData.contacts || [] // Buscar lista de contatos
                };
            } else {
                // Primeiro login, criar documento
                existingUser = {
                    uin: uin,
                    nickname: loginUin.split('@')[0],
                    email: loginUin,
                    status: UserStatus.ONLINE,
                    contacts: []
                };
            }

            // Atualizar status e lastSeen
            await setDoc(userRef, {
                ...existingUser,
                lastSeen: serverTimestamp()
            }, { merge: true });

            playUhOh();
            setCurrentUser(existingUser);
        }

    } catch (err: any) {
        console.error("Falha no login:", err);
        let msg = "❌ Não foi possível " + (isRegistering ? "criar conta" : "fazer login") + ".\n\n";

        // Erros específicos de autenticação
        if (err.code === 'auth/email-already-in-use') {
            msg += "Este email já está em uso.\n\n";
            msg += "💡 Dica: Use o modo de login ou tente outro email.";
        } else if (err.code === 'auth/invalid-email') {
            msg += "Email inválido.\n\n";
            msg += "💡 Use um formato válido: exemplo@dominio.com";
        } else if (err.code === 'auth/weak-password') {
            msg += "Senha muito fraca.\n\n";
            msg += "💡 Use no mínimo 6 caracteres.";
        } else if (err.code === 'auth/user-not-found') {
            msg += "Usuário não encontrado.\n\n";
            msg += "💡 Verifique o email ou crie uma nova conta.";
        } else if (err.code === 'auth/wrong-password') {
            msg += "Senha incorreta.\n\n";
            msg += "💡 Verifique sua senha e tente novamente.";
        } else if (err.code === 'auth/operation-not-allowed') {
            msg += "🔧 SOLUÇÃO:\n";
            msg += "1. Acesse o Firebase Console (https://console.firebase.google.com)\n";
            msg += "2. Selecione seu projeto\n";
            msg += "3. Vá em Authentication → Sign-in method\n";
            msg += "4. Ative a opção 'Email/Password'\n\n";
            msg += "📋 Erro técnico: " + err.code;
        } else if (err.code === 'permission-denied') {
            msg += "🔧 SOLUÇÃO:\n";
            msg += "1. Acesse o Firebase Console\n";
            msg += "2. Vá em Firestore Database → Rules\n";
            msg += "3. Altere as regras para: 'allow read, write: if true;'\n\n";
            msg += "📋 Erro técnico: " + err.code;
        } else {
            msg += "📋 Erro técnico: " + (err.code || err.message);
        }

        alert(msg);
    }
  };

  const openChat = (targetUser: User) => {
    if (!chatSessions[targetUser.uin]) {
      setChatSessions(prev => ({
        ...prev,
        [targetUser.uin]: {
          contactUin: targetUser.uin,
          messages: [],
          draft: '',
          isOpen: true,
          minimized: false
        }
      }));
    } else {
        setChatSessions(prev => ({
            ...prev,
            [targetUser.uin]: { ...prev[targetUser.uin], isOpen: true, minimized: false }
        }))
    }
    setActiveWindow(targetUser.uin);
  };

  const closeChat = (uin: string) => {
    setChatSessions(prev => {
        const newState = { ...prev };
        newState[uin] = { ...newState[uin], isOpen: false };
        return newState;
    });
    if (activeWindow === uin) setActiveWindow(null);
  };

  const sendMessage = async (targetUin: string) => {
    const session = chatSessions[targetUin];
    if (!session || !session.draft.trim() || !currentUser) return;

    const text = session.draft;
    
    // Clear draft immediately
    setChatSessions(prev => ({
        ...prev,
        [targetUin]: { ...prev[targetUin], draft: '' }
    }));

    // Check if target is BOT
    const contact = contacts.find(c => c.uin === targetUin);

    if (contact?.isBot) {
        // --- BOT PATH (Local AI) ---
        const myMsg: Message = {
            id: Date.now().toString(),
            senderUin: currentUser.uin,
            receiverUin: targetUin,
            text: text,
            timestamp: Date.now(),
            read: true
        };
        handleIncomingMessage(myMsg);

        try {
            const responseText = await getBotResponse(text, currentUser.uin, session.messages);
            const botMsg: Message = {
                id: (Date.now() + 1).toString(),
                senderUin: targetUin,
                receiverUin: currentUser.uin,
                text: responseText,
                timestamp: Date.now(),
                read: false
            };
            playUhOh();
            handleIncomingMessage(botMsg);
        } catch (err) {
            console.error(err);
        }
    } else {
        // --- HUMAN PATH (Firebase) ---
        try {
            await addDoc(collection(db, "messages"), {
                senderUin: currentUser.uin,
                receiverUin: targetUin,
                text: text,
                timestamp: serverTimestamp(),
                read: false
            });
            playMsgSound();
        } catch (e) {
            console.error("Error sending message", e);
            alert("Network error: Message not sent. Check Firebase permissions.");
        }
    }
  };

  const updateDraft = (uin: string, text: string) => {
    setChatSessions(prev => ({
      ...prev,
      [uin]: { ...prev[uin], draft: text }
    }));
  };

  useEffect(() => {
    if (activeWindow && chatSessions[activeWindow]?.messages.length) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatSessions, activeWindow]);

  // --- Render ---

  if (!currentUser) {
    return (
      <div className="h-screen w-screen flex items-center justify-center relative">
        <RetroWindow title={isRegistering ? "ICQ - Criar Conta" : "ICQ - Login"} width="w-80" icon={FLOWER_ICON}>
          <form onSubmit={handleLogin} className="flex flex-col gap-4 py-4">
            <div className="flex items-center gap-4">
               <div className="w-16 h-16 bg-gray-300 border-2 border-gray-500 inset shadow-inner flex items-center justify-center">
                   <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                       <path d="M12 2C13.1 2 14 2.9 14 4V9.17C14.83 8.64 15.93 8.64 16.76 9.17L21.09 6.67C22.04 6.12 23.26 6.45 23.81 7.4C24.36 8.35 24.03 9.57 23.08 10.12L18.75 12.62C18.75 13.6 18.75 14.58 18.75 15.56L23.08 18.06C24.03 18.61 24.36 19.83 23.81 20.78C23.26 21.73 22.04 22.06 21.09 21.51L16.76 19.01C15.93 19.54 14.83 19.54 14 19.01V24.18C14 25.28 13.1 26.18 12 26.18C10.9 26.18 10 25.28 10 24.18V19.01C9.17 19.54 8.07 19.54 7.24 19.01L2.91 21.51C1.96 22.06 0.74 21.73 0.19 20.78C-0.36 19.83 -0.03 18.61 0.92 18.06L5.25 15.56C5.25 14.58 5.25 13.6 5.25 12.62L0.92 10.12C-0.03 9.57 -0.36 8.35 0.19 7.4C0.74 6.45 1.96 6.12 2.91 6.67L7.24 9.17C8.07 8.64 9.17 8.64 10 9.17V4C10 2.9 10.9 2 12 2Z" fill="#008000"/>
                   </svg>
               </div>
               <div className="flex flex-col gap-2 w-full">
                  <div className="flex flex-col">
                    <label className="text-xs mb-0.5">Email:</label>
                    <RetroInput
                        value={loginUin}
                        onChange={e => setLoginUin(e.target.value)}
                        placeholder="exemplo@email.com"
                        autoFocus
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs mb-0.5">Senha:</label>
                    <RetroInput
                        type="password"
                        value={loginPass}
                        onChange={e => setLoginPass(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                    />
                  </div>
               </div>
            </div>

            <div className="flex justify-between items-center mt-2">
                <div className="text-xs underline text-blue-800 cursor-pointer hover:text-blue-600" onClick={handleNewUser}>
                    {isRegistering ? "Já tem conta? Entrar" : "Novo Usuário?"}
                </div>
                <RetroButton type="submit" className="w-24">
                    {isRegistering ? "Registrar" : "Conectar"}
                </RetroButton>
            </div>
          </form>
        </RetroWindow>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen p-4 flex gap-4 flex-wrap items-start justify-center md:justify-start">
      
      {/* Contact List */}
      <RetroWindow 
        title={`${currentUser.uin} - ${currentUser.nickname}`} 
        width="w-64" 
        height="h-[80vh] min-h-[400px]" 
        icon={FLOWER_ICON}
        onMinimize={() => {}}
        onClose={() => setCurrentUser(null)}
        className="z-10"
      >
        <div className="mb-2 flex items-center justify-between border-b border-white pb-1">
             <div className="flex items-center gap-2 cursor-pointer bg-gray-200 px-1 border border-gray-400">
                {STATUS_ICONS[currentUser.status]} 
                <span className="text-sm font-bold">{currentUser.status}</span>
                <span className="ml-1 text-[10px]">▼</span>
             </div>
             <div className="text-xs italic text-gray-500">Detecção de Rede: ON</div>
        </div>

        <div className="mb-2">
            <SunkenContainer>
                <div className="flex items-center bg-white px-1">
                    <span className="text-gray-400 mr-1">🔍</span>
                    <input className="w-full text-sm outline-none" placeholder="Buscar contato..." />
                </div>
            </SunkenContainer>
        </div>

        <div className="flex-1 overflow-y-auto bg-white border-2 border-t-black border-l-black border-b-white border-r-white">
            <div className="bg-[#c0c0c0] px-1 py-0.5 text-xs font-bold border-b border-gray-400 flex justify-between items-center">
                <span>Contatos</span>
                <span className="text-[10px] bg-white px-1 border border-gray-500">{contacts.length}</span>
            </div>
            <ul>
                {contacts.map(contact => (
                    <li 
                        key={contact.uin}
                        onDoubleClick={() => openChat(contact)}
                        className="px-2 py-1 hover:bg-[#000080] hover:text-white cursor-pointer flex items-center gap-2 group"
                    >
                        <span className="group-hover:drop-shadow-none">
                            {contact.isBot ? STATUS_ICONS.BOT : STATUS_ICONS[contact.status]}
                        </span>
                        <span className="text-sm font-bold truncate">{contact.nickname}</span>
                    </li>
                ))}
            </ul>
        </div>

        <div className="mt-2 flex justify-between gap-1">
            <RetroButton onClick={handleAddContact} className="flex-1 text-xs">Adicionar</RetroButton>
            <RetroButton onClick={() => setCurrentUser(null)} className="flex-1 text-xs">Sair</RetroButton>
        </div>
      </RetroWindow>

      {/* Chat Windows */}
      {Object.values(chatSessions).map(session => {
          if (!session.isOpen) return null;
          const contact = contacts.find(c => c.uin === session.contactUin) || { 
              uin: session.contactUin, 
              nickname: `UIN ${session.contactUin}`, 
              status: UserStatus.OFFLINE, 
              email: '', 
              isBot: false 
          };

          const isActive = activeWindow === contact.uin;
          
          return (
            <div 
                key={contact.uin} 
                className={`fixed top-10 md:static md:block ${isActive ? 'z-50' : 'z-20'}`}
                onClick={() => setActiveWindow(contact.uin)}
            >
                <RetroWindow
                    title={`Conversa: ${contact.nickname}`}
                    width="w-80 md:w-96"
                    height="h-[500px]"
                    icon={contact.isBot ? STATUS_ICONS.BOT : STATUS_ICONS[contact.status]}
                    onClose={() => closeChat(contact.uin)}
                    isActive={isActive}
                >
                    <div className="flex-1 mb-2 bg-white border-2 border-t-black border-l-black border-b-white border-r-white overflow-y-auto p-2 font-sans">
                        {session.messages.length === 0 && (
                            <div className="text-center text-gray-400 text-xs mt-4">
                                Comece a conversar com {contact.nickname}...
                            </div>
                        )}
                        {session.messages.map((msg, idx) => {
                            const isMe = msg.senderUin === currentUser.uin;
                            return (
                                <div key={msg.id} className="mb-2 text-sm">
                                    <div className={`font-bold text-xs mb-0.5 ${isMe ? 'text-blue-800' : 'text-red-800'}`}>
                                        {isMe ? currentUser.nickname : contact.nickname} 
                                        <span className="text-gray-500 font-normal ml-2 text-[10px]">
                                            {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </span>
                                    </div>
                                    <div className={`pl-2 ${isMe ? 'text-black' : 'text-black'}`}>
                                        {msg.text}
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="bg-[#c0c0c0] mb-1 flex items-center gap-1 p-0.5 border border-transparent">
                        <button className="w-6 h-6 border border-gray-400 flex items-center justify-center font-serif font-bold text-xs hover:bg-gray-300">B</button>
                        <button className="w-6 h-6 border border-gray-400 flex items-center justify-center font-serif italic text-xs hover:bg-gray-300">I</button>
                        <div className="h-4 w-[1px] bg-gray-500 mx-1"></div>
                        <button className="w-6 h-6 hover:bg-gray-300 flex items-center justify-center text-xs">😊</button>
                    </div>

                    <div className="h-24 mb-2">
                        <textarea 
                            className="w-full h-full resize-none border-2 border-t-black border-l-black border-b-white border-r-white p-1 text-sm outline-none font-sans"
                            value={session.draft}
                            onChange={(e) => {
                                updateDraft(contact.uin, e.target.value);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    sendMessage(contact.uin);
                                }
                            }}
                        />
                    </div>

                    <div className="flex justify-between items-center">
                        <div className="flex gap-2">
                             <RetroButton onClick={() => sendMessage(contact.uin)} className="w-20 border-2">Enviar</RetroButton>
                             <div className="text-[10px] text-gray-600 flex flex-col justify-center leading-3">
                                 <span>Enter</span>
                             </div>
                        </div>
                    </div>
                </RetroWindow>
            </div>
          );
      })}
      
      <div className="fixed bottom-0 left-0 w-full bg-[#c0c0c0] border-t-2 border-white flex justify-between px-2 py-1">
            <div className="flex items-center gap-2">
                <RetroButton className="flex items-center gap-1 px-2">
                     <span className="font-bold italic">Iniciar</span>
                </RetroButton>
                <div className="w-[2px] h-6 bg-gray-400 mx-1 border-r border-white"></div>
            </div>
            <div className="flex items-center gap-2 border-2 border-t-gray-500 border-l-gray-500 border-b-white border-r-white px-2 bg-[#c0c0c0] inset shadow-inner">
                 <div className="w-4 h-4">{FLOWER_ICON}</div>
                 <span className="text-xs">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
      </div>

    </div>
  );
}
