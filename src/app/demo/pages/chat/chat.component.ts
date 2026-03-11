import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/demo/shared/shared.module';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

interface Message {
  id: number;
  sender: 'user' | 'other';
  senderName?: string;
  text: string;
  timestamp: Date;
  avatar?: string;
}

interface Conversation {
  id: number;
  name: string;
  avatar: string;
  lastMessage: string;
  unread?: number;
  online?: boolean;
}

type ChatSection = 'community' | 'support' | 'private';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, SharedModule, FormsModule, MatInputModule, MatButtonModule, MatIconModule, MatCardModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export default class ChatComponent {
  activeSection: ChatSection = 'support';
  activeConversationId: number | null = null;

  newMessage = '';

  // --- Chat de la Comunidad ---
  communityMessages: Message[] = [
    {
      id: 1,
      sender: 'other',
      senderName: 'Carlos M.',
      text: '¿Alguien sabe si la ruta 101 está pasando hoy?',
      timestamp: new Date(new Date().getTime() - 600000),
      avatar: 'assets/images/user/avatar-2.jpg'
    },
    {
      id: 2,
      sender: 'other',
      senderName: 'Laura P.',
      text: 'Sí, la vi hace 10 minutos por la Av. Santander.',
      timestamp: new Date(new Date().getTime() - 540000),
      avatar: 'assets/images/user/avatar-2.jpg'
    },
    {
      id: 3,
      sender: 'user',
      text: 'Gracias por la info, voy para allá.',
      timestamp: new Date(new Date().getTime() - 480000)
    },
    {
      id: 4,
      sender: 'other',
      senderName: 'Andrés R.',
      text: 'Ojo que hay desvío por obras en la calle 50.',
      timestamp: new Date(new Date().getTime() - 300000),
      avatar: 'assets/images/user/avatar-2.jpg'
    }
  ];

  // --- Centro de Atención ---
  supportMessages: Message[] = [
    {
      id: 1,
      sender: 'other',
      senderName: 'Soporte Flash Bus',
      text: '¡Hola! Bienvenido al Centro de Atención Flash Bus. ¿En qué podemos ayudarte?',
      timestamp: new Date(new Date().getTime() - 300000),
      avatar: 'assets/images/user/avatar-2.jpg'
    },
    {
      id: 2,
      sender: 'user',
      text: 'Hola, tengo una consulta sobre mi tiquete.',
      timestamp: new Date(new Date().getTime() - 240000)
    },
    {
      id: 3,
      sender: 'other',
      senderName: 'Soporte Flash Bus',
      text: 'Claro, con gusto te ayudamos. ¿Podrías indicarnos el número de tu tiquete?',
      timestamp: new Date(new Date().getTime() - 180000),
      avatar: 'assets/images/user/avatar-2.jpg'
    }
  ];

  // --- Mis Chats (privados) ---
  privateConversations: Conversation[] = [
    { id: 1, name: 'Juan Pérez', avatar: 'assets/images/user/avatar-2.jpg', lastMessage: 'Nos vemos en la parada.', unread: 2, online: true },
    { id: 2, name: 'María García', avatar: 'assets/images/user/avatar-2.jpg', lastMessage: '¿A qué hora sale el bus?', unread: 0, online: false },
    { id: 3, name: 'Pedro López', avatar: 'assets/images/user/avatar-2.jpg', lastMessage: 'Gracias por la info.', unread: 1, online: true }
  ];

  privateMessages: { [convId: number]: Message[] } = {
    1: [
      { id: 1, sender: 'other', senderName: 'Juan Pérez', text: '¿Ya llegaste a la parada?', timestamp: new Date(new Date().getTime() - 120000), avatar: 'assets/images/user/avatar-2.jpg' },
      { id: 2, sender: 'user', text: 'Estoy en camino, 5 minutos.', timestamp: new Date(new Date().getTime() - 60000) },
      { id: 3, sender: 'other', senderName: 'Juan Pérez', text: 'Nos vemos en la parada.', timestamp: new Date(new Date().getTime() - 30000), avatar: 'assets/images/user/avatar-2.jpg' }
    ],
    2: [
      { id: 1, sender: 'other', senderName: 'María García', text: '¿A qué hora sale el bus de las 3?', timestamp: new Date(new Date().getTime() - 3600000), avatar: 'assets/images/user/avatar-2.jpg' },
      { id: 2, sender: 'user', text: 'Sale a las 3:15 de la parada central.', timestamp: new Date(new Date().getTime() - 3500000) }
    ],
    3: [
      { id: 1, sender: 'user', text: 'La ruta 202 pasa cada 20 minutos.', timestamp: new Date(new Date().getTime() - 7200000) },
      { id: 2, sender: 'other', senderName: 'Pedro López', text: 'Gracias por la info.', timestamp: new Date(new Date().getTime() - 7100000), avatar: 'assets/images/user/avatar-2.jpg' }
    ]
  };

  get currentMessages(): Message[] {
    switch (this.activeSection) {
      case 'community':
        return this.communityMessages;
      case 'support':
        return this.supportMessages;
      case 'private':
        return this.activeConversationId !== null
          ? (this.privateMessages[this.activeConversationId] || [])
          : [];
    }
  }

  get currentTitle(): string {
    switch (this.activeSection) {
      case 'community':
        return 'Chat de la Comunidad';
      case 'support':
        return 'Centro de Atención Flash Bus';
      case 'private': {
        const conv = this.privateConversations.find(c => c.id === this.activeConversationId);
        return conv ? conv.name : 'Mis Chats';
      }
    }
  }

  get showChatArea(): boolean {
    if (this.activeSection === 'private') {
      return this.activeConversationId !== null;
    }
    return true;
  }

  setSection(section: ChatSection): void {
    this.activeSection = section;
    if (section !== 'private') {
      this.activeConversationId = null;
    }
  }

  openConversation(convId: number): void {
    this.activeConversationId = convId;
  }

  sendMessage(): void {
    if (!this.newMessage.trim()) return;

    const msg: Message = {
      id: Date.now(),
      sender: 'user',
      text: this.newMessage,
      timestamp: new Date()
    };

    switch (this.activeSection) {
      case 'community':
        this.communityMessages.push(msg);
        break;
      case 'support':
        this.supportMessages.push(msg);
        break;
      case 'private':
        if (this.activeConversationId !== null) {
          this.privateMessages[this.activeConversationId].push(msg);
          const conv = this.privateConversations.find(c => c.id === this.activeConversationId);
          if (conv) conv.lastMessage = this.newMessage;
        }
        break;
    }
    this.newMessage = '';
  }
}
