import React, { useEffect, useState } from 'react';

import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';


// ======================================================
// CONFIGURAÇÃO DAS NOTIFICAÇÕES
// ======================================================

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});


// ======================================================
// APP
// ======================================================

export default function App() {
  const [expoPushToken, setExpoPushToken] = useState('');
  const [titulo, setTitulo] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [enviando, setEnviando] = useState(false);

  const [statusToken, setStatusToken] = useState(
    'Obtendo token...'
  );

  const [erroToken, setErroToken] = useState('');



  // ====================================================
  // AO ABRIR O APP
  // ====================================================

  useEffect(() => {
    obterToken();

    // Escuta notificações recebidas enquanto o app está aberto
    const notificationListener =
      Notifications.addNotificationReceivedListener(
        (notification) => {
          console.log(
            'NOTIFICAÇÃO RECEBIDA:',
            notification
          );
        }
      );

    return () => {
      notificationListener.remove();
    };
  }, []);



  // ====================================================
  // OBTER EXPO PUSH TOKEN
  // ====================================================

  async function obterToken() {
    try {
      setStatusToken('Verificando dispositivo...');
      setErroToken('');

      // -----------------------------------------------
      // Verificar dispositivo físico
      // -----------------------------------------------

      if (!Device.isDevice) {
        const erro =
          'Use um dispositivo físico para obter o Push Token.';

        setErroToken(erro);
        setStatusToken('Erro');

        console.log('ERRO:', erro);

        return;
      }


      // -----------------------------------------------
      // Criar canal no Android
      // -----------------------------------------------

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync(
          'default',
          {
            name: 'default',
            importance:
              Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#0755C9',
          }
        );
      }


      // -----------------------------------------------
      // Solicitar permissão
      // -----------------------------------------------

      setStatusToken(
        'Solicitando permissão de notificações...'
      );

      const {
        status: existingStatus,
      } = await Notifications.getPermissionsAsync();

      let finalStatus = existingStatus;


      if (existingStatus !== 'granted') {
        const {
          status,
        } = await Notifications.requestPermissionsAsync();

        finalStatus = status;
      }


      // -----------------------------------------------
      // Verificar permissão
      // -----------------------------------------------

      if (finalStatus !== 'granted') {
        const erro =
          'Permissão de notificação negada.';

        setErroToken(erro);
        setStatusToken('Permissão negada');

        console.log('ERRO:', erro);

        return;
      }


      // -----------------------------------------------
      // Pegar Project ID
      // -----------------------------------------------

      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ??
        Constants?.easConfig?.projectId;


      if (!projectId) {
        const erro =
          'ProjectId não encontrado. Verifique o app.json.';

        setErroToken(erro);
        setStatusToken('Erro de configuração');

        console.log('ERRO:', erro);

        return;
      }


      console.log('PROJECT ID:', projectId);


      // -----------------------------------------------
      // Obter Expo Push Token
      // -----------------------------------------------

      setStatusToken(
        'Obtendo Expo Push Token...'
      );

      const pushToken =
        await Notifications.getExpoPushTokenAsync({
          projectId,
        });


      // -----------------------------------------------
      // Token recebido
      // -----------------------------------------------

      const token = pushToken.data;

      setExpoPushToken(token);

      setStatusToken(
        'Token obtido com sucesso!'
      );


      // -----------------------------------------------
      // IMPRIMIR NO CONSOLE
      // -----------------------------------------------

      console.log('');
      console.log(
        '=========================================='
      );

      console.log(
        'EXPO PUSH TOKEN:'
      );

      console.log(token);

      console.log(
        '=========================================='
      );

      console.log('');


    } catch (error) {

      console.error(
        'ERRO AO OBTER TOKEN:',
        error
      );

      setStatusToken(
        'Erro ao obter token'
      );

      setErroToken(
        error?.message ||
        String(error)
      );
    }
  }



  // ====================================================
  // ENVIAR NOTIFICAÇÃO
  // ====================================================

  async function enviarNotificacao() {

    if (!expoPushToken.trim()) {
      Alert.alert(
        'Atenção',
        'O Expo Push Token ainda não foi obtido.'
      );

      return;
    }


    if (!mensagem.trim()) {
      Alert.alert(
        'Atenção',
        'Digite uma mensagem.'
      );

      return;
    }


    try {

      setEnviando(true);


      console.log(
        'Enviando notificação para:',
        expoPushToken
      );


      const resposta = await fetch(
        'https://exp.host/--/api/v2/push/send',
        {
          method: 'POST',

          headers: {
            Accept: 'application/json',
            'Accept-Encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },

          body: JSON.stringify({

            to: expoPushToken.trim(),

            sound: 'default',

            title:
              titulo.trim() ||
              'Nova notificação',

            body: mensagem.trim(),

            data: {
              origem: 'painel',
            },
          }),
        }
      );


      const resultado =
        await resposta.json();


      console.log(
        'RESPOSTA DO EXPO:',
        resultado
      );


      if (!resposta.ok) {

        throw new Error(
          resultado?.errors?.[0]?.message ||
          'Não foi possível enviar a notificação.'
        );
      }


      if (
        resultado?.data?.status === 'error'
      ) {

        throw new Error(
          resultado?.data?.message ||
          'O Expo recusou a notificação.'
        );
      }


      Alert.alert(
        'Sucesso',
        'Notificação enviada!'
      );


      setTitulo('');
      setMensagem('');


    } catch (error) {

      console.error(
        'ERRO AO ENVIAR:',
        error
      );


      Alert.alert(
        'Erro',
        error?.message ||
        'Não foi possível enviar a notificação.'
      );


    } finally {

      setEnviando(false);

    }
  }



  // ====================================================
  // SCANNER
  // ====================================================

  function abrirScanner() {

    Alert.alert(
      'Scanner',
      'Aqui você pode integrar o leitor de QR Code do Expo Push Token.'
    );

  }



  // ====================================================
  // INTERFACE
  // ====================================================

  return (

    <SafeAreaView style={styles.safeArea}>

      <StatusBar
        barStyle="light-content"
        backgroundColor="#0755C9"
      />


      <View style={styles.container}>


        {/* CABEÇALHO */}

        <View style={styles.header}>

          <Text style={styles.headerTitle}>
            Enviar Notificação
          </Text>

        </View>



        <KeyboardAvoidingView
          style={styles.flex}
          behavior={
            Platform.OS === 'ios'
              ? 'padding'
              : undefined
          }
        >


          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >


            {/* TOKEN */}

            <View style={styles.fieldContainer}>

              <Text style={styles.label}>
                Token do dispositivo
              </Text>


              <View style={styles.inputWithIcon}>

                <TextInput
                  value={expoPushToken}

                  onChangeText={
                    setExpoPushToken
                  }

                  placeholder="ExponentPushToken[...]"

                  placeholderTextColor="#7B849D"

                  autoCapitalize="none"

                  autoCorrect={false}

                  style={styles.tokenInput}

                  multiline
                />


                <Pressable
                  onPress={abrirScanner}
                  style={styles.scanButton}
                >

                  <Ionicons
                    name="scan-outline"
                    size={27}
                    color="#7B849D"
                  />

                </Pressable>

              </View>


              {/* STATUS DO TOKEN */}

              <Text
                style={[
                  styles.description,
                  statusToken.includes(
                    'sucesso'
                  ) &&
                    styles.successText,
                ]}
              >
                {statusToken}
              </Text>


              {/* ERRO */}

              {erroToken ? (

                <Text style={styles.errorText}>
                  {erroToken}
                </Text>

              ) : null}


              <Text style={styles.description}>

                O token é obtido automaticamente
                neste dispositivo e será usado para
                receber a notificação.

              </Text>

            </View>



            {/* TÍTULO */}

            <View style={styles.fieldContainer}>

              <Text style={styles.label}>
                Título
              </Text>


              <TextInput
                value={titulo}

                onChangeText={setTitulo}

                placeholder="Ex: Promoção Especial"

                placeholderTextColor="#7B849D"

                style={styles.input}

                returnKeyType="next"
              />


              <Text style={styles.description}>
                Título que aparecerá na notificação.
              </Text>

            </View>



            {/* MENSAGEM */}

            <View style={styles.messageContainer}>

              <Text style={styles.label}>
                Mensagem
              </Text>


              <TextInput
                value={mensagem}

                onChangeText={setMensagem}

                placeholder="Digite sua mensagem..."

                placeholderTextColor="#7B849D"

                style={styles.messageInput}

                multiline

                textAlignVertical="top"
              />


              <Text style={styles.description}>
                Mensagem que será enviada na notificação.
              </Text>

            </View>



            {/* BOTÃO */}

            <Pressable
              onPress={enviarNotificacao}

              disabled={
                enviando ||
                !expoPushToken
              }

              style={({ pressed }) => [

                styles.sendButton,

                pressed &&
                  styles.sendButtonPressed,

                enviando &&
                  styles.sendButtonDisabled,

                !expoPushToken &&
                  styles.sendButtonDisabled,

              ]}
            >

              <Ionicons
                name="paper-plane"
                size={24}
                color="#FFFFFF"
              />


              <Text style={styles.sendButtonText}>

                {enviando
                  ? 'Enviando...'
                  : 'Enviar Notificação'}

              </Text>

            </Pressable>


          </ScrollView>

        </KeyboardAvoidingView>

      </View>

    </SafeAreaView>
  );
}



// ======================================================
// ESTILOS
// ======================================================

const styles = StyleSheet.create({

  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  flex: {
    flex: 1,
  },

  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  header: {
    height: 72,

    backgroundColor: '#0755C9',

    alignItems: 'center',

    justifyContent: 'center',

    shadowColor: '#003D96',

    shadowOffset: {
      width: 0,
      height: 3,
    },

    shadowOpacity: 0.15,

    shadowRadius: 5,

    elevation: 4,
  },

  headerTitle: {
    color: '#FFFFFF',

    fontSize: 21,

    fontWeight: '700',

    letterSpacing: -0.3,
  },

  content: {
    paddingHorizontal: 32,

    paddingTop: 30,

    paddingBottom: 42,
  },

  fieldContainer: {
    marginBottom: 29,
  },

  messageContainer: {
    marginBottom: 43,
  },

  label: {
    color: '#101828',

    fontSize: 16,

    fontWeight: '700',

    marginBottom: 11,
  },

  input: {
    height: 54,

    borderWidth: 1,

    borderColor: '#C5CBD8',

    borderRadius: 8,

    paddingHorizontal: 19,

    color: '#27324A',

    fontSize: 15.5,

    backgroundColor: '#FFFFFF',
  },

  inputWithIcon: {
    minHeight: 54,

    borderWidth: 1,

    borderColor: '#C5CBD8',

    borderRadius: 8,

    flexDirection: 'row',

    alignItems: 'center',

    backgroundColor: '#FFFFFF',
  },

  tokenInput: {
    flex: 1,

    minHeight: 52,

    paddingHorizontal: 19,

    paddingVertical: 14,

    color: '#27324A',

    fontSize: 13.5,
  },

  scanButton: {
    width: 54,

    height: 52,

    alignItems: 'center',

    justifyContent: 'center',
  },

  description: {
    color: '#59637D',

    fontSize: 13,

    lineHeight: 19,

    marginTop: 9,
  },

  successText: {
    color: '#12B76A',

    fontWeight: '600',
  },

  errorText: {
    color: '#D92D20',

    fontSize: 13,

    lineHeight: 19,

    marginTop: 7,
  },

  messageInput: {
    height: 248,

    borderWidth: 1,

    borderColor: '#C5CBD8',

    borderRadius: 8,

    paddingHorizontal: 19,

    paddingTop: 17,

    paddingBottom: 17,

    color: '#27324A',

    fontSize: 15.5,

    backgroundColor: '#FFFFFF',
  },

  sendButton: {
    height: 58,

    borderRadius: 7,

    backgroundColor: '#0755C9',

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    shadowColor: '#0755C9',

    shadowOffset: {
      width: 0,
      height: 3,
    },

    shadowOpacity: 0.2,

    shadowRadius: 5,

    elevation: 4,
  },

  sendButtonPressed: {
    opacity: 0.82,

    transform: [
      {
        scale: 0.99,
      },
    ],
  },

  sendButtonDisabled: {
    opacity: 0.55,
  },

  sendButtonText: {
    color: '#FFFFFF',

    fontSize: 18,

    fontWeight: '700',

    marginLeft: 15,
  },

});
