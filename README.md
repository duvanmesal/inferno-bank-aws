# Inferno Bank - Sistema Bancario Serverless

Sistema bancario completo implementado con arquitectura serverless en AWS, usando TypeScript y Terraform para Infrastructure as Code.

## Arquitectura

- **User Service**: Gestión de usuarios (registro, login, perfil, avatares)
- **Card Service**: Gestión de tarjetas y transacciones (débito/crédito, compras, ahorros, pagos)
- **Notification Service**: Envío de notificaciones por email
- **API Gateway**: Endpoints HTTP públicos
- **DynamoDB**: Base de datos NoSQL
- **S3**: Almacenamiento de avatares, reportes y plantillas
- **SQS**: Colas de mensajes con DLQ
- **Secrets Manager**: Gestión de secretos (JWT, passwords)

## Estructura del Proyecto

\`\`\`
inferno-bank/
├── infra/                      # Infraestructura Terraform
│   ├── main.tf
│   ├── providers.tf
│   ├── backend.tf
│   ├── variables.tf
│   ├── outputs.tf
│   └── modules/
│       ├── dynamodb/           # Tablas DynamoDB
│       ├── s3/                 # Buckets S3
│       ├── sqs/                # Colas SQS
│       ├── secrets/            # Secrets Manager
│       ├── iam/                # Roles y políticas IAM
│       ├── lambda/             # Funciones Lambda
│       └── apigw/              # API Gateway
│
├── services/                   # Microservicios Lambda
│   ├── user-service/           # Servicio de usuarios
│   ├── card-service/           # Servicio de tarjetas
│   └── notification-service/   # Servicio de notificaciones
│
└── scripts/                    # Scripts SQL y utilidades
\`\`\`

## Requisitos Previos

1. **AWS CLI** configurado con perfil `inferno-bank`
2. **Terraform** >= 1.5.0
3. **Node.js** >= 20.x
4. **npm** o **yarn**

## Configuración Inicial

### 1. Configurar AWS CLI

\`\`\`bash
aws configure --profile inferno-bank
# Proporcionar:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region: us-east-1
\`\`\`

### 2. Crear Backend de Terraform (primera vez)

\`\`\`bash
# Crear bucket S3 para Terraform state
aws s3 mb s3://inferno-bank-tf-state --profile inferno-bank

# Habilitar versionado
aws s3api put-bucket-versioning \\
  --bucket inferno-bank-tf-state \\
  --versioning-configuration Status=Enabled \\
  --profile inferno-bank

# Crear tabla DynamoDB para locks
aws dynamodb create-table \\
  --table-name inferno-bank-tf-locks \\
  --attribute-definitions AttributeName=LockID,AttributeType=S \\
  --key-schema AttributeName=LockID,KeyType=HASH \\
  --billing-mode PAY_PER_REQUEST \\
  --profile inferno-bank
\`\`\`

### 3. Configurar Variables de Terraform

\`\`\`bash
cd infra
cp terraform.tfvars.example terraform.tfvars
# Editar terraform.tfvars y cambiar jwt_secret_key
\`\`\`

## Despliegue

### 1. Construir Servicios

\`\`\`bash
# User Service
cd services/user-service
npm install
npm run build

# Card Service
cd ../card-service
npm install
npm run build

# Notification Service
cd ../notification-service
npm install
npm run build
\`\`\`

### 2. Desplegar Infraestructura

\`\`\`bash
cd ../../infra

# Inicializar Terraform
terraform init

# Revisar cambios
terraform plan

# Aplicar cambios
terraform apply
\`\`\`

### 3. Configurar SES (Producción)

Para envío de emails en producción:

\`\`\`bash
# Verificar email del remitente
aws ses verify-email-identity \\
  --email-address noreply@infernobank.com \\
  --profile inferno-bank

# Solicitar salida del sandbox
# https://console.aws.amazon.com/ses/
\`\`\`

## API Endpoints

Después del despliegue, obtener la URL de la API:

\`\`\`bash
terraform output api_url
\`\`\`

### User Endpoints

- **POST** `/register` - Registrar nuevo usuario
- **POST** `/login` - Iniciar sesión
- **PUT** `/profile/{user_id}` - Actualizar perfil
- **POST** `/profile/{user_id}/avatar` - Subir avatar
- **GET** `/profile/{user_id}` - Obtener perfil

### Card Endpoints

- **POST** `/card/activate` - Activar tarjeta de crédito
- **POST** `/transactions/purchase` - Realizar compra
- **POST** `/transactions/save/{card_id}` - Agregar ahorros
- **POST** `/card/paid/{card_id}` - Pagar tarjeta de crédito
- **POST** `/card/{card_id}/report` - Generar reporte

## Ejemplos de Uso

### Registrar Usuario

\`\`\`bash
curl -X POST https://your-api-url/register \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Jane",
    "lastName": "Doe",
    "email": "jane@example.com",
    "password": "securepassword123",
    "document": "1234567890"
  }'
\`\`\`

### Iniciar Sesión

\`\`\`bash
curl -X POST https://your-api-url/login \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "jane@example.com",
    "password": "securepassword123"
  }'
\`\`\`

### Realizar Compra

\`\`\`bash
curl -X POST https://your-api-url/transactions/purchase \\
  -H "Content-Type: application/json" \\
  -d '{
    "merchant": "Amazon",
    "cardId": "card-uuid",
    "amount": 100.50
  }'
\`\`\`

## Monitoreo

### CloudWatch Logs

\`\`\`bash
# Ver logs de una función Lambda
aws logs tail /aws/lambda/register-user-lambda-dev --follow --profile inferno-bank
\`\`\`

### Métricas de SQS

\`\`\`bash
# Ver mensajes en DLQ
aws sqs get-queue-attributes \\
  --queue-url $(terraform output -raw create_request_card_dlq_url) \\
  --attribute-names ApproximateNumberOfMessages \\
  --profile inferno-bank
\`\`\`

## Flujo de Negocio

### Registro de Usuario

1. Usuario se registra vía `/register`
2. Se crean automáticamente 2 tarjetas:
   - **DEBIT**: Activada inmediatamente con balance $0
   - **CREDIT**: Estado PENDING con límite basado en score aleatorio
3. Se envía email de bienvenida

### Activación de Tarjeta de Crédito

1. Usuario debe completar 10 transacciones de compra
2. Llamar a `/card/activate` con userId
3. Sistema verifica transacciones y activa tarjeta
4. Se envía email de confirmación

### Transacciones

- **Compras**: Reducen balance (débito) o aumentan usado (crédito)
- **Ahorros**: Solo para débito, aumentan balance
- **Pagos**: Solo para crédito, reducen deuda

## Seguridad

- Passwords hasheados con BCrypt (10 rounds)
- JWT para autenticación (expiración 1h)
- Secrets en AWS Secrets Manager
- Encriptación en reposo (S3, DynamoDB)
- CORS configurado en API Gateway
- Políticas IAM de mínimo privilegio

## Entornos

Gestionar múltiples entornos:

\`\`\`bash
# Desarrollo
terraform apply -var="env=dev"

# Producción
terraform apply -var="env=prod"
\`\`\`

## Limpieza

Para eliminar todos los recursos:

\`\`\`bash
cd infra
terraform destroy
\`\`\`

**ADVERTENCIA**: Esto eliminará todas las bases de datos, buckets S3 y funciones Lambda.

## Troubleshooting

### Lambda no puede acceder a DynamoDB

Verificar políticas IAM en `infra/modules/iam/main.tf`

### Emails no se envían

1. Verificar que el email esté verificado en SES
2. Revisar logs de CloudWatch: `/aws/lambda/send-notifications-lambda-dev`
3. Verificar que no esté en sandbox de SES

### Errores de Terraform

\`\`\`bash
# Refrescar estado
terraform refresh

# Limpiar caché
rm -rf .terraform
terraform init
\`\`\`

## Contribuir

Este proyecto sigue las especificaciones técnicas de Inferno Bank. Para modificaciones:

1. Actualizar código TypeScript en `services/`
2. Ejecutar `npm run build` para generar zips
3. Aplicar cambios con `terraform apply`

## Licencia

Proyecto privado - Inferno Bank © 2025
\`\`\`
