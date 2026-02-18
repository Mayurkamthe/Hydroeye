import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/config';

interface ForgotPasswordScreenProps {
    navigation: any;
}

type Step = 'email' | 'otp' | 'newPassword';

const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ navigation }) => {
    // --- LOGIC STARTS HERE (Unchanged) ---
    const [step, setStep] = useState<Step>('email');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    // Refs for OTP inputs
    const otpInputs = useRef<(TextInput | null)[]>([]);

    const handleSendOtp = async () => {
        if (!email) {
            Alert.alert('Error', 'Please enter your email address');
            return;
        }

        setLoading(true);
        try {
            await api.post(`/auth/forgot-password?email=${encodeURIComponent(email)}`);
            Alert.alert('Success', 'OTP has been sent to your email');
            setStep('otp');
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleOtpChange = (text: string, index: number) => {
        const newOtp = [...otp];
        newOtp[index] = text;
        setOtp(newOtp);

        // Auto-focus next input
        if (text && index < 5) {
            otpInputs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyPress = (key: string, index: number) => {
        if (key === 'Backspace' && !otp[index] && index > 0) {
            otpInputs.current[index - 1]?.focus();
        }
    };

    const handleVerifyOtp = () => {
        const otpValue = otp.join('');
        if (otpValue.length !== 6) {
            Alert.alert('Error', 'Please enter the complete 6-digit OTP');
            return;
        }
        setStep('newPassword');
    };

    const handleResetPassword = async () => {
        if (!newPassword || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }
        if (newPassword.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/reset-password', {
                email,
                otp: otp.join(''),
                newPassword,
            });
            Alert.alert('Success', 'Password reset successfully', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };
    // --- LOGIC ENDS HERE ---

    const renderEmailStep = () => (
        <>
            <View style={styles.iconWrapper}>
                <View style={styles.iconContainer}>
                    <Ionicons name="mail-outline" size={32} color="#fff" />
                </View>
            </View>
            <Text style={styles.title}>Forgot Password</Text>
            <Text style={styles.subtitle}>
                Enter your email address and we'll send you a code to reset your password.
            </Text>

            <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#4169E1" style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="name@example.com"
                    placeholderTextColor="#A0A0A0"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
            </View>

            <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleSendOtp}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>Send Code</Text>
                )}
            </TouchableOpacity>
        </>
    );

    const renderOtpStep = () => (
        <>
            <View style={styles.iconWrapper}>
                <View style={styles.iconContainer}>
                    <Ionicons name="keypad-outline" size={32} color="#fff" />
                </View>
            </View>
            <Text style={styles.title}>Enter OTP</Text>
            <Text style={styles.subtitle}>
                We've sent a 6-digit code to{"\n"}<Text style={{ color: '#4169E1', fontWeight: '600' }}>{email}</Text>
            </Text>

            <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                    <TextInput
                        key={index}
                        ref={(ref) => { otpInputs.current[index] = ref }}
                        style={[styles.otpInput, digit ? styles.otpInputFilled : null]}
                        value={digit}
                        onChangeText={(text) => handleOtpChange(text, index)}
                        onKeyPress={({ nativeEvent }) => handleOtpKeyPress(nativeEvent.key, index)}
                        keyboardType="number-pad"
                        maxLength={1}
                        selectTextOnFocus
                        selectionColor="#4169E1"
                    />
                ))}
            </View>

            <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleVerifyOtp}
                disabled={loading}
            >
                <Text style={styles.buttonText}>Verify OTP</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.resendLink} onPress={handleSendOtp}>
                <Text style={styles.resendText}>Didn't receive the code? <Text style={styles.linkBold}>Resend</Text></Text>
            </TouchableOpacity>
        </>
    );

    const renderNewPasswordStep = () => (
        <>
            <View style={styles.iconWrapper}>
                <View style={styles.iconContainer}>
                    <Ionicons name="shield-checkmark-outline" size={32} color="#fff" />
                </View>
            </View>
            <Text style={styles.title}>New Password</Text>
            <Text style={styles.subtitle}>
                Your identity has been verified. Create a new strong password.
            </Text>

            <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#4169E1" style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="New Password"
                    placeholderTextColor="#A0A0A0"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#A0A0A0" />
                </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#4169E1" style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="Confirm Password"
                    placeholderTextColor="#A0A0A0"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showPassword}
                />
            </View>

            <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleResetPassword}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>Reset Password</Text>
                )}
            </TouchableOpacity>
        </>
    );

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {/* Back Button */}
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => {
                            if (step === 'email') {
                                navigation.goBack();
                            } else if (step === 'otp') {
                                setStep('email');
                            } else {
                                setStep('otp');
                            }
                        }}
                    >
                        <Ionicons name="arrow-back" size={24} color="#4169E1" />
                    </TouchableOpacity>

                    {/* Card */}
                    <View style={styles.card}>
                        {step === 'email' && renderEmailStep()}
                        {step === 'otp' && renderOtpStep()}
                        {step === 'newPassword' && renderNewPasswordStep()}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA', // Matching theme
    },
    scrollContent: {
        flexGrow: 1,
        padding: 24,
        justifyContent: 'center',
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 5,
        alignItems: 'center',
    },
    iconWrapper: {
        marginBottom: 24,
        shadowColor: '#4169E1',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    iconContainer: {
        width: 72,
        height: 72,
        backgroundColor: '#4169E1',
        borderRadius: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 22,
        paddingHorizontal: 16,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FAFAFA',
        borderRadius: 16,
        marginBottom: 16,
        paddingHorizontal: 16,
        height: 56,
        borderWidth: 1,
        borderColor: '#F0F0F0',
        width: '100%',
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    eyeIcon: {
        padding: 8,
    },
    button: {
        height: 56,
        backgroundColor: '#4169E1',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        marginTop: 8,
        shadowColor: '#4169E1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 32,
        paddingHorizontal: 4,
    },
    otpInput: {
        width: 44,
        height: 52,
        borderRadius: 12,
        backgroundColor: '#FAFAFA',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        textAlign: 'center',
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    otpInputFilled: {
        borderColor: '#4169E1',
        backgroundColor: '#EEF2FF', // Very light blue
    },
    resendLink: {
        marginTop: 24,
    },
    resendText: {
        color: '#666',
        fontSize: 14,
    },
    linkBold: {
        color: '#4169E1',
        fontWeight: 'bold',
    },
});

export default ForgotPasswordScreen;