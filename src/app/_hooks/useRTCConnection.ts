import {useCallback, useContext, useMemo, useRef} from "react";
import {GameContext} from "@/app/_contexts/IGameContext";

export default function useRTCConnection() {
  const game = useContext(GameContext);

  const peerConnection = useRef<RTCPeerConnection | undefined>(undefined);
  const dataChannel = useRef<RTCDataChannel | undefined>(undefined);
  const sdp = useRef<string | undefined>(undefined);
  const status = useRef<string>("closed");

  // Data channel オプション
  const dataChannelOptions = useMemo(() => ({
    ordered: false,
  }), []);

  const setStatus = useCallback((value: string) => {
    status.current = value;
  }, []);

  const setSdp = useCallback((value: string | undefined) => {
    sdp.current = value;
    game.setLocalSdp(value);
  }, [game]);

  const setupDataChannel = useCallback((dc: RTCDataChannel) => {
    dc.onerror = (error) => {
      console.log('Data channel error:', error);
    };
    dc.onmessage = (evt) => {
      console.log('Data channel message:', evt.data);
      let msg = evt.data;
    };
    dc.onopen = (evt) => {
      console.log('Data channel opened:', evt);
      game.setState("start");
    };
    dc.onclose = () => {
      console.log('Data channel closed.');
    };
  }, []);

  const createPeerConnection = useCallback(() => {
    let peerConnectionConfig = {'iceServers': [{"urls": "stun:stun.l.google.com:19302"}]};
    let pc = new RTCPeerConnection(peerConnectionConfig);

    // ICE candidate 取得時のイベントハンドラを登録
    pc.onicecandidate = (evt) => {
      if (evt.candidate) {
        // 一部の ICE candidate を取得
        // Trickle ICE では ICE candidate を相手に通知する
        console.log(evt.candidate);
        console.log('Collecting ICE candidates');
      } else {
        // 全ての ICE candidate の取得完了（空の ICE candidate イベント）
        // Vanilla ICE では，全てのICE candidate を含んだ SDP を相手に通知する
        // （SDP は pc.localDescription.sdp で取得できる）
        // 今回は手動でシグナリングするため textarea に SDP を表示する
        setSdp(pc.localDescription?.sdp);
        console.log('Vanilla ICE ready', sdp.current);
      }
    };

    pc.onconnectionstatechange = (evt) => {
      switch (pc.connectionState) {
        case "connected":
          setStatus('connected');
          break;
        case "disconnected":
        case "failed":
          setStatus('disconnected');
          break;
        case "closed":
          setStatus('closed');
          break;
      }
    };

    pc.ondatachannel = (evt) => {
      console.log('Data channel created:', evt);
      setupDataChannel(evt.channel);
      dataChannel.current = evt.channel;
    };

    return pc;
  }, [setSdp, setStatus, setupDataChannel]);

  const startPeerConnection = useCallback(() => {
    // 新しい RTCPeerConnection を作成する
    peerConnection.current = createPeerConnection();

    // Data channel を生成
    dataChannel.current = peerConnection.current.createDataChannel('test-data-channel', dataChannelOptions);
    setupDataChannel(dataChannel.current);

    // Offer を生成する
    peerConnection.current.createOffer().then(function (sessionDescription) {
      console.log('createOffer() succeeded.');
      return peerConnection.current!.setLocalDescription(sessionDescription);
    }).then(function () {
      // setLocalDescription() が成功した場合
      // Trickle ICE ではここで SDP を相手に通知する
      // Vanilla ICE では ICE candidate が揃うのを待つ
      console.log('setLocalDescription() succeeded.');
    }).catch(function (err) {
      console.error('setLocalDescription() failed.', err);
    });

    console.log('offer created');
  }, [createPeerConnection, dataChannelOptions, setupDataChannel]);

  const setRemoteSdp = useCallback((remoteSdpText: string) => {
    if (peerConnection.current) {
      // Peer Connection が生成済みの場合，SDP を Answer と見なす
      let answer = new RTCSessionDescription({
        type: 'answer',
        sdp: remoteSdpText,
      });
      peerConnection.current!.setRemoteDescription(answer).then(function () {
        console.log('setRemoteDescription() succeeded.');
      }).catch((err) => {
        console.error('setRemoteDescription() failed.', err);
      });
    } else {
      // Peer Connection が未生成の場合，SDP を Offer と見なす
      let offer = new RTCSessionDescription({
        type: 'offer',
        sdp: remoteSdpText,
      });
      // Peer Connection を生成
      peerConnection.current = createPeerConnection();
      peerConnection.current.setRemoteDescription(offer).then(function () {
        console.log('setRemoteDescription() succeeded.');
      }).catch(function (err) {
        console.error('setRemoteDescription() failed.', err);
      });
      // Answer を生成
      peerConnection.current.createAnswer().then(function (sessionDescription) {
        console.log('createAnswer() succeeded.');
        return peerConnection.current!.setLocalDescription(sessionDescription);
      }).then(function () {
        // setLocalDescription() が成功した場合
        // Trickle ICE ではここで SDP を相手に通知する
        // Vanilla ICE では ICE candidate が揃うのを待つ
        console.log('setLocalDescription() succeeded.');
      }).catch(function (err) {
        console.error('setLocalDescription() failed.', err);
      });
      console.log('answer created');
    }
  }, [createPeerConnection]);

  const send = useCallback((data: any) => {
    if (!peerConnection || peerConnection.current!.connectionState != 'connected') {
      alert('PeerConnection is not established.');
      return false;
    }
    console.log(data)
    let msg = JSON.stringify(data);
    dataChannel.current!.send(msg);

    return true;
  }, []);

  return {
    startPeerConnection,
    setRemoteSdp,
    send,
  }
}