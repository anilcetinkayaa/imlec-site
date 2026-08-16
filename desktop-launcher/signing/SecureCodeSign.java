import java.util.ArrayList;
import java.util.Arrays;
import javax.swing.BoxLayout;
import javax.swing.JLabel;
import javax.swing.JOptionPane;
import javax.swing.JPanel;
import javax.swing.JPasswordField;
import javax.swing.JTextField;

public final class SecureCodeSign {
    private SecureCodeSign() {}

    public static void main(String[] ignored) {
        String inputFiles = System.getenv("IMLEC_SIGN_INPUT");
        if (inputFiles == null || inputFiles.isBlank()) {
            throw new IllegalStateException("IMLEC_SIGN_INPUT is not configured.");
        }

        JTextField usernameField = new JTextField(28);
        JPasswordField passwordField = new JPasswordField(28);
        JPanel panel = new JPanel();
        panel.setLayout(new BoxLayout(panel, BoxLayout.Y_AXIS));
        panel.add(new JLabel("SSL.com username"));
        panel.add(usernameField);
        panel.add(new JLabel("SSL.com password"));
        panel.add(passwordField);

        int answer = JOptionPane.showConfirmDialog(
            null,
            panel,
            "SSL.com eSigner Login",
            JOptionPane.OK_CANCEL_OPTION,
            JOptionPane.PLAIN_MESSAGE
        );
        if (answer != JOptionPane.OK_OPTION) {
            System.exit(2);
        }

        String username = usernameField.getText().trim();
        char[] passwordChars = passwordField.getPassword();
        passwordField.setText("");
        if (username.isBlank() || passwordChars.length == 0) {
            Arrays.fill(passwordChars, '\0');
            throw new IllegalArgumentException("Username and password are required.");
        }

        String password = new String(passwordChars);
        Arrays.fill(passwordChars, '\0');

        try {
            String credentialId = System.getenv("IMLEC_SIGN_CREDENTIAL_ID");
            for (String inputFile : inputFiles.split("\\|")) {
                if (inputFile.isBlank()) {
                    continue;
                }

                ArrayList<String> arguments = new ArrayList<>();
                arguments.add("sign");
                arguments.add("-username=" + username);
                arguments.add("-password=" + password);
                arguments.add("-input_file_path=" + inputFile);
                if (credentialId != null && !credentialId.isBlank()) {
                    arguments.add("-credential_id=" + credentialId);
                }
                arguments.add("-override");
                com.ssl.code.signing.tool.CodeSignTool.main(arguments.toArray(new String[0]));
            }
        } finally {
            password = null;
            username = null;
        }
    }
}
