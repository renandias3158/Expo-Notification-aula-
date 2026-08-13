import React, { useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
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

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { Ionicons } from '@expo/vector-icons';

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';


// ======================================================
// CONFIGURAÇÃO
// ======================================================

const SUPABASE_URL =
  'https://cgdkhufktnclezagrhek.supabase.co';

const SUPABASE_KEY =
  'sb_publishable_IPsf8cTazQXIOxTS-EvkdQ_G7bVSGCj';

const USUARIO_URL =
  `${SUPABASE_URL}/rest/v1/usuario`;


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
// NAVEGAÇÃO
// ======================================================

const Stack = createNativeStackNavigator();


// ======================================================
// CABEÇALHO PERSONALIZADO
// ======================================================

function Cabecalho({ titulo }) {
  return (
    <View style={styles.header}>
      <View style={styles.headerIcon}>
        <Ionicons
          name="notifications-outline"
          size={24}
          color="#FFFFFF"
        />
      </View>

      <Text style={styles.headerTitle}>
        {titulo}
      </Text>
    </View>
  );
}


// ======================================================
// COMPONENTE DE INPUT
// ======================================================

function Campo({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  editable = true,
  multiline = false,
}) {
  return (
    <View style={styles.fieldContainer}>

      <Text style={styles.label}>
        {label}
      </Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#98A2B3"
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        editable={editable}
        multiline={multiline}
        autoCapitalize="none"
        autoCorrect={false}
        style={[
          styles.input,
          multiline && styles.multilineInput,
          !editable && styles.disabledInput,
        ]}
      />

    </View>
  );
}


// ======================================================
// BOTÃO
// ======================================================

function Botao({
  titulo,
  onPress,
  loading = false,
  disabled = false,
  icon = 'arrow-forward',
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,

        pressed && styles.buttonPressed,

        (disabled || loading) &&
          styles.buttonDisabled,
      ]}
    >

      {loading ? (
        <ActivityIndicator
          color="#FFFFFF"
          size="small"
        />
      ) : (
        <>
          <Ionicons
            name={icon}
            size={21}
            color="#FFFFFF"
          />

          <Text style={styles.buttonText}>
            {titulo}
          </Text>
        </>
      )}

    </Pressable>
  );
}


// ======================================================
// FUNÇÃO PARA OBTER TOKEN PUSH
// ======================================================

async function obterTokenPush() {
  if (!Device.isDevice) {
    throw new Error(
      'É necessário utilizar um dispositivo físico para obter o token de notificações.'
    );
  }

  // Canal Android
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(
      'default',
      {
        name: 'default',
        importance:
          Notifications.AndroidImportance.MAX,

        vibrationPattern: [
          0,
          250,
          250,
          250,
        ],

        lightColor: '#0755C9',
      }
    );
  }

  // Verificar permissão atual
  const {
    status: existingStatus,
  } = await Notifications.getPermissionsAsync();

  let finalStatus = existingStatus;

  // Solicitar permissão
  if (existingStatus !== 'granted') {
    const {
      status,
    } = await Notifications.requestPermissionsAsync();

    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    throw new Error(
      'Permissão para notificações foi negada.'
    );
  }

  // Project ID do Expo/EAS
  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ??
    Constants?.easConfig?.projectId;

  if (!projectId) {
    throw new Error(
      'ProjectId não encontrado. Configure o EAS projectId no app.json/app.config.js.'
    );
  }

  const pushToken =
    await Notifications.getExpoPushTokenAsync({
      projectId,
    });

  return pushToken.data;
}


// ======================================================
// TELA 1 - CADASTRO
// ======================================================

function CadastroScreen({ navigation }) {

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const [token, setToken] = useState('');

  const [statusToken, setStatusToken] =
    useState('Obtendo token...');

  const [cadastrando, setCadastrando] =
    useState(false);

  const [obtendoToken, setObtendoToken] =
    useState(true);


  // ----------------------------------------------------
  // Obter token quando abrir a tela
  // ----------------------------------------------------

  useEffect(() => {

    async function carregarToken() {

      try {

        setObtendoToken(true);

        const novoToken =
          await obterTokenPush();

        setToken(novoToken);

        setStatusToken(
          'Token obtido com sucesso!'
        );

      } catch (error) {

        console.error(
          'Erro ao obter token:',
          error
        );

        setStatusToken(
          error?.message ||
          'Não foi possível obter o token.'
        );

      } finally {

        setObtendoToken(false);

      }
    }

    carregarToken();

  }, []);


  // ----------------------------------------------------
  // CADASTRAR USUÁRIO
  // ----------------------------------------------------

  async function cadastrar() {

    if (!nome.trim()) {
      Alert.alert(
        'Atenção',
        'Digite o nome.'
      );
      return;
    }

    if (!email.trim()) {
      Alert.alert(
        'Atenção',
        'Digite o e-mail.'
      );
      return;
    }

    if (!senha.trim()) {
      Alert.alert(
        'Atenção',
        'Digite a senha.'
      );
      return;
    }

    if (senha.length < 6) {
      Alert.alert(
        'Atenção',
        'A senha deve possuir pelo menos 6 caracteres.'
      );
      return;
    }

    if (!token.trim()) {
      Alert.alert(
        'Atenção',
        'O token de notificação ainda não foi obtido.'
      );
      return;
    }


    try {

      setCadastrando(true);


      // -----------------------------------------------
      // Verificar se o e-mail já existe
      // -----------------------------------------------

      const consultaEmail =
        `${USUARIO_URL}?email=eq.${encodeURIComponent(
          email.trim()
        )}&select=*`;

      const respostaEmail =
        await fetch(
          consultaEmail,
          {
            method: 'GET',

            headers: {
              apikey: SUPABASE_KEY,

              Authorization:
                `Bearer ${SUPABASE_KEY}`,

              Accept:
                'application/json',
            },
          }
        );


      if (!respostaEmail.ok) {
        throw new Error(
          'Não foi possível verificar o e-mail.'
        );
      }


      const usuariosExistentes =
        await respostaEmail.json();


      if (
        Array.isArray(usuariosExistentes) &&
        usuariosExistentes.length > 0
      ) {

        Alert.alert(
          'Cadastro',
          'Este e-mail já está cadastrado.'
        );

        return;
      }


      // -----------------------------------------------
      // Objeto enviado ao Supabase
      // -----------------------------------------------

      const novoUsuario = {
        nome: nome.trim(),

        email: email.trim(),

        senha: senha,

        token: token.trim(),
      };


      console.log(
        'CADASTRANDO USUÁRIO:',
        novoUsuario
      );


      // -----------------------------------------------
      // POST Supabase
      // -----------------------------------------------

      const resposta =
        await fetch(
          USUARIO_URL,
          {
            method: 'POST',

            headers: {
              apikey: SUPABASE_KEY,

              Authorization:
                `Bearer ${SUPABASE_KEY}`,

              'Content-Type':
                'application/json',

              Prefer:
                'return=representation',
            },

            body:
              JSON.stringify(
                novoUsuario
              ),
          }
        );


      const resultado =
        await resposta.json();


      console.log(
        'RESPOSTA CADASTRO:',
        resultado
      );


      if (!resposta.ok) {

        throw new Error(
          resultado?.message ||
          resultado?.hint ||
          resultado?.details ||
          'Não foi possível cadastrar o usuário.'
        );

      }


      Alert.alert(
        'Cadastro realizado',
        'Usuário cadastrado com sucesso!',
        [
          {
            text: 'OK',

            onPress: () => {

              navigation.replace(
                'Login'
              );

            },
          },
        ]
      );


    } catch (error) {

      console.error(
        'ERRO CADASTRO:',
        error
      );

      Alert.alert(
        'Erro',
        error?.message ||
        'Não foi possível realizar o cadastro.'
      );

    } finally {

      setCadastrando(false);

    }
  }


  // ----------------------------------------------------
  // INTERFACE
  // ----------------------------------------------------

  return (

    <SafeAreaView style={styles.safeArea}>

      <StatusBar
        barStyle="light-content"
        backgroundColor="#0755C9"
      />

      <View style={styles.container}>

        <Cabecalho
          titulo="Cadastro"
        />


        <KeyboardAvoidingView
          style={styles.flex}
          behavior={
            Platform.OS === 'ios'
              ? 'padding'
              : undefined
          }
        >

          <ScrollView
            contentContainerStyle={
              styles.content
            }
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >


            <View style={styles.logoCircle}>

              <Ionicons
                name="person-add-outline"
                size={34}
                color="#FFFFFF"
              />

            </View>


            <Text style={styles.screenTitle}>
              Crie sua conta
            </Text>

            <Text style={styles.screenSubtitle}>
              Cadastre-se para enviar e receber
              notificações.
            </Text>


            <Campo
              label="Nome"
              value={nome}
              onChangeText={setNome}
              placeholder="Digite seu nome"
            />


            <Campo
              label="E-mail"
              value={email}
              onChangeText={setEmail}
              placeholder="Digite seu e-mail"
              keyboardType="email-address"
            />


            <Campo
              label="Senha"
              value={senha}
              onChangeText={setSenha}
              placeholder="Digite sua senha"
              secureTextEntry
            />


            <View style={styles.fieldContainer}>

              <Text style={styles.label}>
                Token de notificação
              </Text>


              <View style={styles.tokenBox}>

                <Ionicons
                  name="phone-portrait-outline"
                  size={21}
                  color="#667085"
                />

                <Text
                  style={styles.tokenText}
                  numberOfLines={2}
                >
                  {token ||
                    'Obtendo token do dispositivo...'}
                </Text>

              </View>


              <View
                style={[
                  styles.statusBox,
                  token &&
                    styles.statusSuccess,
                ]}
              >

                <Ionicons
                  name={
                    token
                      ? 'checkmark-circle'
                      : 'information-circle-outline'
                  }
                  size={17}
                  color={
                    token
                      ? '#12B76A'
                      : '#667085'
                  }
                />

                <Text
                  style={[
                    styles.statusText,
                    token &&
                      styles.statusSuccessText,
                  ]}
                >
                  {obtendoToken
                    ? 'Obtendo token automaticamente...'
                    : statusToken}
                </Text>

              </View>


              <Text style={styles.description}>
                O token é obtido automaticamente
                pelo dispositivo e será salvo no
                cadastro.
              </Text>

            </View>


            <Botao
              titulo="Cadastrar"
              icon="person-add-outline"
              onPress={cadastrar}
              loading={cadastrando}
              disabled={
                cadastrando ||
                obtendoToken ||
                !token
              }
            />


            <Pressable
              style={styles.linkButton}
              onPress={() =>
                navigation.navigate('Login')
              }
            >

              <Text style={styles.linkText}>
                Já tem uma conta?{' '}
                <Text style={styles.linkStrong}>
                  Entrar
                </Text>
              </Text>

            </Pressable>


          </ScrollView>

        </KeyboardAvoidingView>

      </View>

    </SafeAreaView>
  );
}


// ======================================================
// TELA 2 - LOGIN
// ======================================================

function LoginScreen({ navigation }) {

  const [email, setEmail] =
    useState('');

  const [senha, setSenha] =
    useState('');

  const [entrando, setEntrando] =
    useState(false);


  // ----------------------------------------------------
  // LOGIN
  // ----------------------------------------------------

  async function login() {

    if (!email.trim()) {
      Alert.alert(
        'Atenção',
        'Digite seu e-mail.'
      );
      return;
    }

    if (!senha.trim()) {
      Alert.alert(
        'Atenção',
        'Digite sua senha.'
      );
      return;
    }


    try {

      setEntrando(true);


      const url =
        `${USUARIO_URL}?email=eq.${encodeURIComponent(
          email.trim()
        )}&senha=eq.${encodeURIComponent(
          senha
        )}&select=*`;


      console.log(
        'CONSULTANDO LOGIN:',
        url
      );


      const resposta =
        await fetch(
          url,
          {
            method: 'GET',

            headers: {
              apikey: SUPABASE_KEY,

              Authorization:
                `Bearer ${SUPABASE_KEY}`,

              Accept:
                'application/json',
            },
          }
        );


      if (!resposta.ok) {

        throw new Error(
          'Não foi possível consultar o servidor.'
        );

      }


      const usuarios =
        await resposta.json();


      console.log(
        'RESULTADO LOGIN:',
        usuarios
      );


      // ------------------------------------------------
      // Usuário encontrado
      // ------------------------------------------------

      if (
        Array.isArray(usuarios) &&
        usuarios.length > 0
      ) {

        const usuario =
          usuarios[0];


        navigation.replace(
          'Enviar',
          {
            usuario,
          }
        );


        return;
      }


      // ------------------------------------------------
      // Usuário não encontrado
      // ------------------------------------------------

      Alert.alert(
        'Login inválido',
        'O e-mail ou a senha estão incorretos.'
      );


    } catch (error) {

      console.error(
        'ERRO LOGIN:',
        error
      );

      Alert.alert(
        'Erro',
        error?.message ||
        'Não foi possível realizar o login.'
      );

    } finally {

      setEntrando(false);

    }
  }


  return (

    <SafeAreaView style={styles.safeArea}>

      <StatusBar
        barStyle="light-content"
        backgroundColor="#0755C9"
      />

      <View style={styles.container}>

        <Cabecalho
          titulo="Login"
        />


        <KeyboardAvoidingView
          style={styles.flex}
          behavior={
            Platform.OS === 'ios'
              ? 'padding'
              : undefined
          }
        >

          <ScrollView
            contentContainerStyle={
              styles.loginContent
            }
            keyboardShouldPersistTaps="handled"
          >


            <View style={styles.logoCircle}>

              <Ionicons
                name="notifications-outline"
                size={35}
                color="#FFFFFF"
              />

            </View>


            <Text style={styles.screenTitle}>
              Acesse sua conta
            </Text>

            <Text style={styles.screenSubtitle}>
              Entre para enviar notificações.
            </Text>


            <Campo
              label="E-mail"
              value={email}
              onChangeText={setEmail}
              placeholder="Digite seu e-mail"
              keyboardType="email-address"
            />


            <Campo
              label="Senha"
              value={senha}
              onChangeText={setSenha}
              placeholder="Digite sua senha"
              secureTextEntry
            />


            <Botao
              titulo="Entrar"
              icon="log-in-outline"
              onPress={login}
              loading={entrando}
              disabled={entrando}
            />


            <Pressable
              style={styles.linkButton}
              onPress={() =>
                navigation.navigate(
                  'Cadastro'
                )
              }
            >

              <Text style={styles.linkText}>
                Não tem uma conta?{' '}
                <Text style={styles.linkStrong}>
                  Criar conta
                </Text>
              </Text>

            </Pressable>


          </ScrollView>

        </KeyboardAvoidingView>

      </View>

    </SafeAreaView>
  );
}


// ======================================================
// TELA 3 - ENVIO DE NOTIFICAÇÃO
// ======================================================

function EnviarScreen({ navigation, route }) {

  const usuarioLogado =
    route.params?.usuario;


  const [usuarios, setUsuarios] =
    useState([]);

  const [usuarioSelecionado, setUsuarioSelecionado] =
    useState(null);

  const [titulo, setTitulo] =
    useState('');

  const [mensagem, setMensagem] =
    useState('');

  const [carregandoUsuarios, setCarregandoUsuarios] =
    useState(true);

  const [enviando, setEnviando] =
    useState(false);

  const [modalAberto, setModalAberto] =
    useState(false);


  // ----------------------------------------------------
  // CARREGAR USUÁRIOS
  // ----------------------------------------------------

  useEffect(() => {

    carregarUsuarios();

  }, []);


  async function carregarUsuarios() {

    try {

      setCarregandoUsuarios(true);


      const resposta =
        await fetch(
          `${USUARIO_URL}?select=*`,
          {
            method: 'GET',

            headers: {
              apikey: SUPABASE_KEY,

              Authorization:
                `Bearer ${SUPABASE_KEY}`,

              Accept:
                'application/json',
            },
          }
        );


      if (!resposta.ok) {

        throw new Error(
          'Não foi possível carregar os usuários.'
        );

      }


      const dados =
        await resposta.json();


      console.log(
        'USUÁRIOS:',
        dados
      );


      if (Array.isArray(dados)) {

        setUsuarios(dados);

      }


    } catch (error) {

      console.error(
        'ERRO AO CARREGAR USUÁRIOS:',
        error
      );

      Alert.alert(
        'Erro',
        error?.message ||
        'Não foi possível carregar os usuários.'
      );

    } finally {

      setCarregandoUsuarios(false);

    }
  }


  // ----------------------------------------------------
  // ENVIAR NOTIFICAÇÃO
  // ----------------------------------------------------

  async function enviarNotificacao() {

    if (!usuarioSelecionado) {

      Alert.alert(
        'Atenção',
        'Selecione um usuário.'
      );

      return;
    }


    if (
      !usuarioSelecionado.token ||
      !usuarioSelecionado.token.trim()
    ) {

      Alert.alert(
        'Atenção',
        'O usuário selecionado não possui token de notificação.'
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
        'ENVIANDO PARA:',
        usuarioSelecionado.nome
      );

      console.log(
        'TOKEN:',
        usuarioSelecionado.token
      );


      const resposta =
        await fetch(
          'https://exp.host/--/api/v2/push/send',
          {
            method: 'POST',

            headers: {
              Accept:
                'application/json',

              'Accept-Encoding':
                'gzip, deflate',

              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify({

                to:
                  usuarioSelecionado.token.trim(),

                sound:
                  'default',

                title:
                  titulo.trim() ||
                  'Nova notificação',

                body:
                  mensagem.trim(),

                data: {
                  origem:
                    'aplicativo',

                  remetente:
                    usuarioLogado?.nome ||
                    'Usuário',
                },

              }),
          }
        );


      const resultado =
        await resposta.json();


      console.log(
        'RESPOSTA EXPO:',
        resultado
      );


      if (!resposta.ok) {

        throw new Error(
          resultado?.errors?.[0]?.message ||
          resultado?.message ||
          'Não foi possível enviar a notificação.'
        );

      }


      // -----------------------------------------------
      // Expo retornou erro no ticket
      // -----------------------------------------------

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
        `Notificação enviada para ${usuarioSelecionado.nome}!`
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


  // ----------------------------------------------------
  // LOGOUT
  // ----------------------------------------------------

  function sair() {

    navigation.replace(
      'Login'
    );

  }


  return (

    <SafeAreaView style={styles.safeArea}>

      <StatusBar
        barStyle="light-content"
        backgroundColor="#0755C9"
      />

      <View style={styles.container}>


        <View style={styles.header}>

          <View>

            <Text style={styles.headerTitle}>
              Enviar Notificação
            </Text>

            <Text style={styles.headerSubtitle}>
              Olá, {usuarioLogado?.nome || 'usuário'}
            </Text>

          </View>


          <Pressable
            onPress={sair}
            style={styles.logoutButton}
          >

            <Ionicons
              name="log-out-outline"
              size={23}
              color="#FFFFFF"
            />

          </Pressable>

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
            contentContainerStyle={
              styles.content
            }
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >


            <View style={styles.pageIcon}>

              <Ionicons
                name="paper-plane-outline"
                size={32}
                color="#0755C9"
              />

            </View>


            <Text style={styles.screenTitle}>
              Enviar uma notificação
            </Text>

            <Text style={styles.screenSubtitle}>
              Escolha um usuário e envie uma
              mensagem diretamente para o dispositivo.
            </Text>


            {/* ---------------------------------------
                SELEÇÃO DO USUÁRIO
            ---------------------------------------- */}

            <View style={styles.fieldContainer}>

              <Text style={styles.label}>
                Selecionar usuário
              </Text>


              <Pressable
                style={styles.select}
                onPress={() =>
                  setModalAberto(true)
                }
              >

                <View style={styles.selectLeft}>

                  <Ionicons
                    name="person-outline"
                    size={20}
                    color="#667085"
                  />

                  <Text
                    style={[
                      styles.selectText,
                      !usuarioSelecionado &&
                        styles.placeholderText,
                    ]}
                  >
                    {usuarioSelecionado
                      ? usuarioSelecionado.nome
                      : 'Escolha um usuário'}
                  </Text>

                </View>


                <Ionicons
                  name="chevron-down"
                  size={20}
                  color="#667085"
                />

              </Pressable>

            </View>


            {/* ---------------------------------------
                TÍTULO
            ---------------------------------------- */}

            <Campo
              label="Título"
              value={titulo}
              onChangeText={setTitulo}
              placeholder="Digite o título da notificação"
            />


            {/* ---------------------------------------
                MENSAGEM
            ---------------------------------------- */}

            <Campo
              label="Mensagem"
              value={mensagem}
              onChangeText={setMensagem}
              placeholder="Digite a mensagem..."
              multiline
            />


            <Text style={styles.counter}>
              {mensagem.length}/200
            </Text>


            {/* ---------------------------------------
                DESTINATÁRIO
            ---------------------------------------- */}

            {usuarioSelecionado && (

              <View style={styles.recipientCard}>

                <View style={styles.recipientIcon}>

                  <Ionicons
                    name="person"
                    size={20}
                    color="#0755C9"
                  />

                </View>


                <View style={styles.recipientInfo}>

                  <Text style={styles.recipientLabel}>
                    Destinatário
                  </Text>

                  <Text style={styles.recipientName}>
                    {usuarioSelecionado.nome}
                  </Text>

                  <Text style={styles.recipientEmail}>
                    {usuarioSelecionado.email}
                  </Text>

                </View>

              </View>

            )}


            {/* ---------------------------------------
                BOTÃO ENVIAR
            ---------------------------------------- */}

            <Botao
              titulo="Enviar Notificação"
              icon="paper-plane"
              onPress={enviarNotificacao}
              loading={enviando}
              disabled={
                enviando ||
                !usuarioSelecionado ||
                !mensagem.trim()
              }
            />


          </ScrollView>

        </KeyboardAvoidingView>


        {/* ==========================================
            MODAL DE USUÁRIOS
        =========================================== */}

        <Modal
          visible={modalAberto}
          transparent
          animationType="fade"
          onRequestClose={() =>
            setModalAberto(false)
          }
        >

          <Pressable
            style={styles.modalOverlay}
            onPress={() =>
              setModalAberto(false)
            }
          >

            <Pressable
              style={styles.modalContent}
              onPress={(event) =>
                event.stopPropagation()
              }
            >

              <View style={styles.modalHeader}>

                <Text style={styles.modalTitle}>
                  Selecionar usuário
                </Text>

                <Pressable
                  onPress={() =>
                    setModalAberto(false)
                  }
                >

                  <Ionicons
                    name="close"
                    size={25}
                    color="#344054"
                  />

                </Pressable>

              </View>


              {carregandoUsuarios ? (

                <View style={styles.loadingBox}>

                  <ActivityIndicator
                    color="#0755C9"
                  />

                  <Text style={styles.loadingText}>
                    Carregando usuários...
                  </Text>

                </View>

              ) : usuarios.length === 0 ? (

                <View style={styles.emptyBox}>

                  <Ionicons
                    name="people-outline"
                    size={40}
                    color="#98A2B3"
                  />

                  <Text style={styles.emptyText}>
                    Nenhum usuário cadastrado.
                  </Text>

                </View>

              ) : (

                <ScrollView
                  style={styles.userList}
                  showsVerticalScrollIndicator={false}
                >

                  {usuarios.map(
                    (usuario, index) => (

                      <Pressable
                        key={
                          usuario.id ??
                          usuario.email ??
                          index
                        }
                        style={({ pressed }) => [
                          styles.userItem,
                          pressed &&
                            styles.userItemPressed,
                        ]}
                        onPress={() => {

                          setUsuarioSelecionado(
                            usuario
                          );

                          setModalAberto(
                            false
                          );

                        }}
                      >

                        <View style={styles.userAvatar}>

                          <Text
                            style={styles.avatarText}
                          >
                            {usuario.nome
                              ?.charAt(0)
                              ?.toUpperCase() ||
                              '?'}
                          </Text>

                        </View>


                        <View
                          style={styles.userInfo}
                        >

                          <Text
                            style={styles.userName}
                          >
                            {usuario.nome}
                          </Text>

                          <Text
                            style={styles.userEmail}
                          >
                            {usuario.email}
                          </Text>

                        </View>


                        {usuarioSelecionado?.email ===
                          usuario.email && (

                          <Ionicons
                            name="checkmark-circle"
                            size={23}
                            color="#0755C9"
                          />

                        )}

                      </Pressable>

                    )
                  )}

                </ScrollView>

              )}

            </Pressable>

          </Pressable>

        </Modal>


      </View>

    </SafeAreaView>
  );
}


// ======================================================
// APP PRINCIPAL
// ======================================================

export default function App() {

  return (

    <NavigationContainer>

      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >

        <Stack.Screen
          name="Cadastro"
          component={CadastroScreen}
        />

        <Stack.Screen
          name="Login"
          component={LoginScreen}
        />

        <Stack.Screen
          name="Enviar"
          component={EnviarScreen}
        />

      </Stack.Navigator>

    </NavigationContainer>
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


  // ================================================
  // HEADER
  // ================================================

  header: {
    minHeight: 76,

    paddingHorizontal: 24,

    backgroundColor: '#0755C9',

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    shadowColor: '#003D96',

    shadowOffset: {
      width: 0,
      height: 3,
    },

    shadowOpacity: 0.18,

    shadowRadius: 5,

    elevation: 4,
  },

  headerIcon: {
    width: 42,
    height: 42,

    borderRadius: 12,

    backgroundColor: '#2B78E8',

    alignItems: 'center',

    justifyContent: 'center',

    marginRight: 12,
  },

  headerTitle: {
    color: '#FFFFFF',

    fontSize: 21,

    fontWeight: '700',

    letterSpacing: -0.3,
  },

  headerSubtitle: {
    color: '#DCEBFF',

    fontSize: 12,

    marginTop: 2,
  },

  logoutButton: {
    width: 42,
    height: 42,

    borderRadius: 12,

    backgroundColor: 'rgba(255,255,255,0.15)',

    alignItems: 'center',

    justifyContent: 'center',
  },


  // ================================================
  // CONTENT
  // ================================================

  content: {
    paddingHorizontal: 28,

    paddingTop: 30,

    paddingBottom: 50,
  },

  loginContent: {
    paddingHorizontal: 28,

    paddingTop: 55,

    paddingBottom: 50,

    justifyContent: 'center',
  },


  // ================================================
  // ÍCONES
  // ================================================

  logoCircle: {
    width: 70,
    height: 70,

    borderRadius: 20,

    backgroundColor: '#0755C9',

    alignItems: 'center',

    justifyContent: 'center',

    alignSelf: 'center',

    marginBottom: 18,

    shadowColor: '#0755C9',

    shadowOffset: {
      width: 0,
      height: 4,
    },

    shadowOpacity: 0.22,

    shadowRadius: 7,

    elevation: 4,
  },

  pageIcon: {
    width: 62,
    height: 62,

    borderRadius: 18,

    backgroundColor: '#EAF2FF',

    alignItems: 'center',

    justifyContent: 'center',

    alignSelf: 'center',

    marginBottom: 18,
  },


  // ================================================
  // TÍTULOS
  // ================================================

  screenTitle: {
    color: '#101828',

    fontSize: 24,

    fontWeight: '700',

    textAlign: 'center',

    marginBottom: 8,
  },

  screenSubtitle: {
    color: '#667085',

    fontSize: 14,

    lineHeight: 21,

    textAlign: 'center',

    marginBottom: 32,

    paddingHorizontal: 10,
  },


  // ================================================
  // FORMULÁRIO
  // ================================================

  fieldContainer: {
    marginBottom: 22,
  },

  label: {
    color: '#101828',

    fontSize: 14,

    fontWeight: '700',

    marginBottom: 9,
  },

  input: {
    height: 52,

    borderWidth: 1,

    borderColor: '#D0D5DD',

    borderRadius: 9,

    paddingHorizontal: 16,

    color: '#27324A',

    fontSize: 15,

    backgroundColor: '#FFFFFF',
  },

  multilineInput: {
    height: 140,

    paddingTop: 15,

    paddingBottom: 15,

    textAlignVertical: 'top',
  },

  disabledInput: {
    backgroundColor: '#F2F4F7',
    color: '#667085',
  },


  // ================================================
  // TOKEN
  // ================================================

  tokenBox: {
    minHeight: 58,

    borderWidth: 1,

    borderColor: '#D0D5DD',

    borderRadius: 9,

    paddingHorizontal: 14,

    paddingVertical: 10,

    flexDirection: 'row',

    alignItems: 'center',

    backgroundColor: '#F9FAFB',
  },

  tokenText: {
    flex: 1,

    color: '#475467',

    fontSize: 12,

    lineHeight: 17,

    marginLeft: 10,
  },

  statusBox: {
    flexDirection: 'row',

    alignItems: 'center',

    marginTop: 9,

    padding: 9,

    borderRadius: 7,

    backgroundColor: '#F2F4F7',
  },

  statusSuccess: {
    backgroundColor: '#ECFDF3',
  },

  statusText: {
    color: '#667085',

    fontSize: 12,

    marginLeft: 7,

    flex: 1,
  },

  statusSuccessText: {
    color: '#039855',

    fontWeight: '600',
  },

  description: {
    color: '#667085',

    fontSize: 12,

    lineHeight: 18,

    marginTop: 8,
  },


  // ================================================
  // BOTÃO
  // ================================================

  button: {
    minHeight: 56,

    borderRadius: 9,

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

    marginTop: 8,
  },

  buttonPressed: {
    opacity: 0.82,

    transform: [
      {
        scale: 0.99,
      },
    ],
  },

  buttonDisabled: {
    opacity: 0.5,
  },

  buttonText: {
    color: '#FFFFFF',

    fontSize: 16,

    fontWeight: '700',

    marginLeft: 10,
  },


  // ================================================
  // LINKS
  // ================================================

  linkButton: {
    alignItems: 'center',

    paddingVertical: 18,
  },

  linkText: {
    color: '#667085',

    fontSize: 13,
  },

  linkStrong: {
    color: '#0755C9',

    fontWeight: '700',
  },


  // ================================================
  // SELECT
  // ================================================

  select: {
    minHeight: 54,

    borderWidth: 1,

    borderColor: '#D0D5DD',

    borderRadius: 9,

    paddingHorizontal: 15,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    backgroundColor: '#FFFFFF',
  },

  selectLeft: {
    flexDirection: 'row',

    alignItems: 'center',

    flex: 1,
  },

  selectText: {
    color: '#344054',

    fontSize: 15,

    marginLeft: 10,
  },

  placeholderText: {
    color: '#98A2B3',
  },


  // ================================================
  // CONTADOR
  // ================================================

  counter: {
    color: '#98A2B3',

    fontSize: 11,

    textAlign: 'right',

    marginTop: -15,

    marginBottom: 20,
  },


  // ================================================
  // DESTINATÁRIO
  // ================================================

  recipientCard: {
    borderWidth: 1,

    borderColor: '#B2DDFF',

    backgroundColor: '#EFF8FF',

    borderRadius: 10,

    padding: 13,

    flexDirection: 'row',

    alignItems: 'center',

    marginBottom: 20,
  },

  recipientIcon: {
    width: 40,
    height: 40,

    borderRadius: 20,

    backgroundColor: '#D1E9FF',

    alignItems: 'center',

    justifyContent: 'center',
  },

  recipientInfo: {
    marginLeft: 11,

    flex: 1,
  },

  recipientLabel: {
    color: '#667085',

    fontSize: 11,
  },

  recipientName: {
    color: '#101828',

    fontSize: 15,

    fontWeight: '700',

    marginTop: 2,
  },

  recipientEmail: {
    color: '#667085',

    fontSize: 11,

    marginTop: 2,
  },


  // ================================================
  // MODAL
  // ================================================

  modalOverlay: {
    flex: 1,

    backgroundColor:
      'rgba(16,24,40,0.45)',

    justifyContent: 'center',

    paddingHorizontal: 22,
  },

  modalContent: {
    maxHeight: '75%',

    backgroundColor: '#FFFFFF',

    borderRadius: 16,

    padding: 20,

    shadowColor: '#000',

    shadowOffset: {
      width: 0,
      height: 6,
    },

    shadowOpacity: 0.2,

    shadowRadius: 12,

    elevation: 8,
  },

  modalHeader: {
    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    paddingBottom: 16,

    borderBottomWidth: 1,

    borderBottomColor: '#EAECF0',

    marginBottom: 4,
  },

  modalTitle: {
    color: '#101828',

    fontSize: 18,

    fontWeight: '700',
  },

  userList: {
    marginTop: 5,
  },

  userItem: {
    minHeight: 68,

    flexDirection: 'row',

    alignItems: 'center',

    paddingVertical: 10,

    borderBottomWidth: 1,

    borderBottomColor: '#F2F4F7',
  },

  userItemPressed: {
    backgroundColor: '#F9FAFB',
  },

  userAvatar: {
    width: 42,
    height: 42,

    borderRadius: 21,

    backgroundColor: '#EAF2FF',

    alignItems: 'center',

    justifyContent: 'center',
  },

  avatarText: {
    color: '#0755C9',

    fontSize: 17,

    fontWeight: '700',
  },

  userInfo: {
    flex: 1,

    marginLeft: 12,
  },

  userName: {
    color: '#101828',

    fontSize: 14,

    fontWeight: '600',
  },

  userEmail: {
    color: '#667085',

    fontSize: 11,

    marginTop: 3,
  },

  loadingBox: {
    alignItems: 'center',

    justifyContent: 'center',

    paddingVertical: 40,
  },

  loadingText: {
    color: '#667085',

    fontSize: 13,

    marginTop: 12,
  },

  emptyBox: {
    alignItems: 'center',

    justifyContent: 'center',

    paddingVertical: 40,
  },

  emptyText: {
    color: '#667085',

    fontSize: 13,

    marginTop: 10,
  },
});
