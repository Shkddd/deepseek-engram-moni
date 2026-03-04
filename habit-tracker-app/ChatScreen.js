import React, { useState, useEffect, useContext, useRef } from 'react';
import { ThemeContext } from './App';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import {
  RTCPeerConnection,
  RTCSessionDescription,
  RTCIceCandidate,
  mediaDevices,
} from 'react-native-webrtc';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from './App';

// STUN 服务器配置（免费的公开 STUN 服务器）
const STUN_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

// P2P 聊天屏幕
function ChatScreen() {
  const context = useContext(ThemeContext);
  // 防止 Context 未初始化
  const theme = context?.theme || {
    dark: false,
    colors: {
      background: '#F5F6F7',
      card: '#FFFFFF',
      text: '#1D2129',
      textLight: '#86909C',
      border: '#E5E6EB',
      primary: '#3370FF',
      success: '#00B365',
      danger: '#F53F3F',
      gray: '#F5F6F7',
      inputBg: '#f9f9f9',
    }
  };
  const [localOffer, setLocalOffer] = useState('');
  const [remoteOffer, setRemoteOffer] = useState('');
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('未连接');
  const [myPeerId, setMyPeerId] = useState('');
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [showGroupChat, setShowGroupChat] = useState(false);
  const [groupMessages, setGroupMessages] = useState([]);
  const [groupMessage, setGroupMessage] = useState('');
  
  const peerConnection = useRef(null);
  const dataChannel = useRef(null);

  useEffect(() => {
    initPeerConnection();
    loadMessages();
    loadGroupMessages();
    return () => {
      if (peerConnection.current) {
        peerConnection.current.close();
      }
    };
  }, []);

  // 加载群消息
  const loadGroupMessages = async () => {
    try {
      const stored = await AsyncStorage.getItem('group_messages');
      if (stored) setGroupMessages(JSON.parse(stored));
    } catch (e) { console.error('加载群消息失败', e); }
  };

  // 保存群消息
  const saveGroupMessages = async (msgs) => {
    try { await AsyncStorage.setItem('group_messages', JSON.stringify(msgs)); } catch (e) {}
  };

  // 发送群消息
  const sendGroupMessage = () => {
    if (!groupMessage.trim()) return;
    const msg = { id: Date.now().toString(), text: groupMessage.trim(), sender: '我', time: new Date().toISOString() };
    const newMsgs = [...groupMessages, msg];
    setGroupMessages(newMsgs);
    saveGroupMessages(newMsgs);
    setGroupMessage('');
  };

  const initPeerConnection = () => {
    peerConnection.current = new RTCPeerConnection(STUN_SERVERS);
    
    // 生成随机 Peer ID
    const peerId = 'user_' + Math.random().toString(36).substr(2, 9);
    setMyPeerId(peerId);

    // 创建 Data Channel 用于消息传输
    dataChannel.current = peerConnection.current.createDataChannel('chat');
    
    dataChannel.current.onopen = () => {
      setConnectionStatus('已连接');
      console.log('Data Channel opened');
    };
    
    dataChannel.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        setMessages((prev) => [...prev, message]);
      } catch (err) {
        console.error('解析消息失败:', err);
      }
    };
    
    dataChannel.current.onerror = (error) => {
      console.error('Data Channel error:', error);
      setConnectionStatus('连接错误');
    };

    peerConnection.current.ondatachannel = (event) => {
      const receiveChannel = event.channel;
      receiveChannel.onmessage = (e) => {
        try {
          const message = JSON.parse(e.data);
          setMessages((prev) => [...prev, message]);
        } catch (err) {
          console.error('解析消息失败:', err);
        }
      };
    };

    peerConnection.current.oniceconnectionstatechange = () => {
      console.log('ICE Connection State:', peerConnection.current.iceConnectionState);
      if (peerConnection.current.iceConnectionState === 'connected') {
        setConnectionStatus('已连接');
      } else if (peerConnection.current.iceConnectionState === 'disconnected') {
        setConnectionStatus('已断开');
      }
    };
  };

  const loadMessages = async () => {
    try {
      const stored = await AsyncStorage.getItem('chat_messages');
      if (stored) {
        setMessages(JSON.parse(stored));
      }
    } catch (error) {
      console.error('加载消息失败:', error);
      setMessages([]); // 设置为空数组避免崩溃
    }
  };

  const saveMessages = async (newMessages) => {
    try {
      await AsyncStorage.setItem('chat_messages', JSON.stringify(newMessages));
    } catch (error) {
      console.error('保存消息失败:', error);
    }
  };

  // 创建 offer（主动发起连接）
  const createOffer = async () => {
    try {
      setConnectionStatus('创建连接中...');
      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);
      setLocalOffer(JSON.stringify(offer));
      setConnectionStatus('等待对方接受');
    } catch (error) {
      console.error('创建 Offer 失败:', error);
      Alert.alert('错误', '创建连接失败');
    }
  };

  // 接受对方的 offer
  const acceptOffer = async () => {
    try {
      if (!remoteOffer) {
        Alert.alert('提示', '请先粘贴对方的连接信息');
        return;
      }
      setConnectionStatus('接受连接中...');
      let offer;
      try {
        offer = JSON.parse(remoteOffer);
      } catch (e) {
        Alert.alert('错误', '连接信息格式无效');
        return;
      }
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
      
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);
      
      setLocalOffer(JSON.stringify(answer));
      setConnectionStatus('等待对方确认');
    } catch (error) {
      console.error('接受 Offer 失败:', error);
      Alert.alert('错误', '接受连接失败');
    }
  };

  // 添加 ICE Candidate（对方的回应中包含）
  const addIceCandidate = async () => {
    try {
      if (!remoteOffer) {
        Alert.alert('提示', '请先粘贴对方的连接信息');
        return;
      }
      let data;
      try {
        data = JSON.parse(remoteOffer);
      } catch (e) {
        Alert.alert('错误', '连接信息格式无效');
        return;
      }
      if (data.iceCandidate) {
        await peerConnection.current.addIceCandidate(new RTCIceCandidate(data.iceCandidate));
      }
    } catch (error) {
      console.error('添加 ICE Candidate 失败:', error);
    }
  };

  // 发送消息
  const sendMessage = () => {
    if (!inputMessage.trim()) {
      return;
    }
    if (connectionStatus !== '已连接') {
      Alert.alert('提示', '请先建立 P2P 连接');
      return;
    }
    
    const message = {
      id: Date.now().toString(),
      text: inputMessage.trim(),
      sender: myPeerId,
      timestamp: new Date().toISOString(),
    };
    
    if (dataChannel.current && dataChannel.current.readyState === 'open') {
      dataChannel.current.send(JSON.stringify(message));
      setMessages((prev) => {
        const newMessages = [...prev, message];
        saveMessages(newMessages);
        return newMessages;
      });
      setInputMessage('');
    } else {
      Alert.alert('提示', '连接未建立，请先建立连接');
    }
  };

  const renderMessage = ({ item }) => {
    const isMe = item.sender === myPeerId;
    return (
      <View style={[
        styles.messageBubble,
        isMe ? styles.myMessage : styles.theirMessage,
        { backgroundColor: isMe ? theme.colors.primary : theme.colors.card }
      ]}>
        <Text style={[
          styles.messageText,
          { color: isMe ? '#fff' : theme.colors.text }
        ]}>
          {item.text}
        </Text>
        <Text style={[
          styles.messageTime,
          { color: isMe ? 'rgba(255,255,255,0.7)' : theme.colors.textLight }
        ]}>
          {new Date(item.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} backgroundColor={theme.colors.card} />
      
      {/* 连接状态 */}
      <View style={[styles.statusBar, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
        <View style={styles.statusInfo}>
          <Text style={[styles.statusLabel, { color: theme.colors.textLight }]}>我的 ID:</Text>
          <Text style={[styles.peerId, { color: theme.colors.primary }]} selectable>{myPeerId}</Text>
        </View>
        <View style={[styles.connectionBadge, { 
          backgroundColor: connectionStatus === '已连接' ? theme.colors.success + '20' : theme.colors.warning + '20' 
        }]}>
          <Text style={[styles.connectionStatus, { 
            color: connectionStatus === '已连接' ? theme.colors.success : theme.colors.warning 
          }]}>
            {connectionStatus}
          </Text>
        </View>
      </View>

      {/* 连接操作区 */}
      <View style={[styles.connectSection, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>🔗 P2P 连接</Text>
        
        <View style={styles.offerArea}>
          <Text style={[styles.inputLabel, { color: theme.colors.textLight }]}>粘贴对方发来的连接信息:</Text>
          <TextInput
            style={[styles.offerInput, { 
              backgroundColor: theme.colors.inputBg, 
              borderColor: theme.colors.border, 
              color: theme.colors.text 
            }]}
            placeholder="在这里粘贴对方的连接信息..."
            placeholderTextColor={theme.colors.textLight}
            value={remoteOffer}
            onChangeText={setRemoteOffer}
            multiline
            numberOfLines={3}
          />
        </View>
        
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: theme.colors.primary }]} 
            onPress={createOffer}
          >
            <Text style={styles.actionButtonText}>📤 创建连接</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: theme.colors.success }]} 
            onPress={acceptOffer}
          >
            <Text style={styles.actionButtonText}>✅ 接受连接</Text>
          </TouchableOpacity>
        </View>

        {localOffer ? (
          <View style={styles.offerArea}>
            <Text style={[styles.inputLabel, { color: theme.colors.textLight }]}>发送给对方的连接信息:</Text>
            <TextInput
              style={[styles.offerInput, { 
                backgroundColor: theme.colors.inputBg, 
                borderColor: theme.colors.primary, 
                color: theme.colors.text 
              }]}
              value={localOffer}
              editable={false}
              multiline
              numberOfLines={3}
            />
            <Text style={[styles.hint, { color: theme.colors.textLight }]}>
              💡 将以上信息复制发送给对方，对方粘贴后点击"接受连接"
            </Text>
          </View>
        ) : null}
      </View>

      {/* 消息列表 */}
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        style={styles.messageList}
        contentContainerStyle={styles.messageListContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.colors.textLight }]}>
              {connectionStatus === '已连接' ? '可以开始聊天了！' : '请先建立 P2P 连接'}
            </Text>
          </View>
        }
      />

      {/* 消息输入 */}
      <View style={[styles.inputBar, { backgroundColor: theme.colors.card, borderTopColor: theme.colors.border }]}>
        <TextInput
          style={[styles.messageInput, { 
            backgroundColor: theme.colors.inputBg, 
            borderColor: theme.colors.border, 
            color: theme.colors.text 
          }]}
          placeholder="输入消息..."
          placeholderTextColor={theme.colors.textLight}
          value={inputMessage}
          onChangeText={setInputMessage}
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity 
          style={[styles.sendButton, { backgroundColor: theme.colors.primary }]} 
          onPress={() => setShowPlusMenu(!showPlusMenu)}
        >
          <Text style={styles.sendButtonText}>+</Text>
        </TouchableOpacity>
      </View>
      
      {/* 微信式加号浮窗 */}
      {showPlusMenu && (
        <View style={[styles.plusMenu, { backgroundColor: theme.colors.card }]}>
          <TouchableOpacity style={styles.plusMenuItem} onPress={() => { setShowGroupChat(true); setShowPlusMenu(false); }}>
            <Text style={styles.plusMenuIcon}>👥</Text>
            <Text style={[styles.plusMenuText, { color: theme.colors.text }]}>群聊</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* 群聊界面 */}
      {showGroupChat && (
        <View style={[styles.groupOverlay, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.groupHeader, { backgroundColor: theme.colors.card }]}>
            <TouchableOpacity onPress={() => setShowGroupChat(false)}><Text style={{color: theme.colors.primary}}>← 返回</Text></TouchableOpacity>
            <Text style={{color: theme.colors.text, fontWeight: 'bold'}}>群聊</Text>
            <View style={{width:50}}/>
          </View>
          <FlatList data={groupMessages} keyExtractor={i => i.id} renderItem={({item}) => (
            <View style={[styles.groupMsg, item.sender==='我'&&styles.groupMsgMy]}>
              <Text style={{color:theme.colors.textLight, fontSize:12}}>{item.sender}</Text>
              <Text style={{color: theme.colors.text}}>{item.text}</Text>
            </View>
          )} />
          <View style={[styles.groupInput, { backgroundColor: theme.colors.card, borderTopColor: theme.colors.border }]}>
            <TextInput style={{flex:1, borderWidth:1, borderRadius:20, paddingHorizontal:15, marginRight:10, color: theme.colors.text}} 
              placeholder="输入群消息..." placeholderTextColor={theme.colors.textLight} value={groupMessage} onChangeText={setGroupMessage} />
            <TouchableOpacity style={[styles.sendButton, { backgroundColor: theme.colors.primary }]} onPress={sendGroupMessage}>
              <Text style={styles.sendButtonText}>发送</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  peerId: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  connectionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  connectionStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  connectSection: {
    padding: 12,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  offerArea: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    marginBottom: 6,
  },
  offerInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 12,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  hint: {
    fontSize: 11,
    marginTop: 6,
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    padding: 12,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  myMessage: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
  },
  inputBar: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 15,
    marginRight: 10,
  },
  sendButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default ChatScreen;
