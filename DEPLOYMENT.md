# Guía de Despliegue - Inferno Bank

Esta guía detalla el proceso completo de despliegue del sistema Inferno Bank en AWS.

## Pre-requisitos

- Cuenta de AWS con permisos de AdministratorAccess
- AWS CLI instalado y configurado
- Terraform >= 1.5.0
- Node.js >= 20.x
- Git

## Paso 1: Configuración de AWS

### 1.1 Crear IAM User

\`\`\`bash
# En la consola de AWS IAM, crear usuario con:
# - Access type: Programmatic access
# - Permissions: AdministratorAccess y AdministratorAccess-Amplify
\`\`\`

### 1.2 Configurar AWS CLI

\`\`\`bash
aws configure --profile inferno-bank
# AWS Access Key ID: [tu-access-key]
# AWS Secret Access Key: [tu-secret-key]
# Default region name: us-east-1
# Default output format: json
\`\`\`

### 1.3 Verificar Configuración

\`\`\`bash
aws sts get-caller-identity --profile inferno-bank
\`\`\`

## Paso 2: Preparar Backend de Terraform

### 2.1 Crear S3 Bucket para State

\`\`\`bash
# Crear bucket
aws s3 mb s3://inferno-bank-tf-state \\
  --region us-east-1 \\
  --profile inferno-bank

# Habilitar versionado
aws s3api put-bucket-versioning \\
  --bucket inferno-bank-tf-state \\
  --versioning-configuration Status=Enabled \\
  --profile inferno-bank

# Habilitar encriptación
aws s3api put-bucket-encryption \\
  --bucket inferno-bank-tf-state \\
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }' \\
  --profile inferno-bank

# Bloquear acceso público
aws s3api put-public-access-block \\
  --bucket inferno-bank-tf-state \\
  --public-access-block-configuration \\
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true \\
  --profile inferno-bank
\`\`\`

### 2.2 Crear DynamoDB Table para Locks

\`\`\`bash
aws dynamodb create-table \\
  --table-name inferno-bank-tf-locks \\
  --attribute-definitions AttributeName=LockID,AttributeType=S \\
  --key-schema AttributeName=LockID,KeyType=HASH \\
  --billing-mode PAY_PER_REQUEST \\
  --region us-east-1 \\
  --profile inferno-bank
\`\`\`

## Paso 3: Clonar y Configurar Proyecto

### 3.1 Clonar Repositorio

\`\`\`bash
git clone <repository-url>
cd inferno-bank
\`\`\`

### 3.2 Configurar Variables de Terraform

\`\`\`bash
cd infra
cp terraform.tfvars.example terraform.tfvars
\`\`\`

Editar `terraform.tfvars`:

\`\`\`hcl
aws_region  = "us-east-1"
aws_profile = "inferno-bank"
env         = "dev"
project_name = "inferno-bank"

# IMPORTANTE: Generar secret fuerte
jwt_secret_key = "tu-secret-jwt-muy-seguro-cambiar-esto"
password_bcrypt_rounds = 10
\`\`\`

**Generar JWT Secret seguro:**

\`\`\`bash
# Linux/Mac
openssl rand -base64 32

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
\`\`\`

## Paso 4: Construir Servicios

### 4.1 User Service

\`\`\`bash
cd services/user-service
npm install
npm run build
# Verificar: dist/user-service.zip debe existir
\`\`\`

### 4.2 Card Service

\`\`\`bash
cd ../card-service
npm install
npm run build
# Verificar: dist/card-service.zip debe existir
\`\`\`

### 4.3 Notification Service

\`\`\`bash
cd ../notification-service
npm install
npm run build
# Verificar: dist/notification-service.zip debe existir
\`\`\`

## Paso 5: Desplegar con Terraform

### 5.1 Inicializar Terraform

\`\`\`bash
cd ../../infra
terraform init
\`\`\`

Debe mostrar:

\`\`\`
Terraform has been successfully initialized!
\`\`\`

### 5.2 Validar Configuración

\`\`\`bash
terraform validate
\`\`\`

### 5.3 Planificar Despliegue

\`\`\`bash
terraform plan -out=tfplan
\`\`\`

Revisar que se crearán aproximadamente 60-70 recursos.

### 5.4 Aplicar Despliegue

\`\`\`bash
terraform apply tfplan
\`\`\`

Este proceso toma 5-10 minutos. Al finalizar mostrará los outputs:

\`\`\`
Outputs:

api_url = "https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com"
user_table_name = "user-table-dev"
card_table_name = "card-table-dev"
...
\`\`\`

## Paso 6: Configuración Post-Despliegue

### 6.1 Configurar SES para Emails

**Desarrollo (Sandbox):**

\`\`\`bash
# Verificar email del remitente
aws ses verify-email-identity \\
  --email-address noreply@infernobank.com \\
  --region us-east-1 \\
  --profile inferno-bank

# Verificar email de prueba (para recibir)
aws ses verify-email-identity \\
  --email-address tu-email@example.com \\
  --region us-east-1 \\
  --profile inferno-bank
\`\`\`

**Producción:**

1. Ir a AWS SES Console
2. Solicitar salida del sandbox: https://console.aws.amazon.com/ses/
3. Configurar DKIM para tu dominio
4. Actualizar FROM_EMAIL en Lambda si usas dominio personalizado

### 6.2 Subir Plantillas de Email (Opcional)

Si deseas usar plantillas personalizadas en lugar de las predeterminadas:

\`\`\`bash
# Obtener nombre del bucket
TEMPLATES_BUCKET=$(terraform output -raw templates_bucket_name)

# Subir plantillas (crear archivos HTML primero)
aws s3 cp WELCOME.html s3://$TEMPLATES_BUCKET/WELCOME.html --profile inferno-bank
aws s3 cp USER.LOGIN.html s3://$TEMPLATES_BUCKET/USER.LOGIN.html --profile inferno-bank
# ... repetir para cada tipo de notificación
\`\`\`

## Paso 7: Verificar Despliegue

### 7.1 Verificar API Gateway

\`\`\`bash
API_URL=$(terraform output -raw api_url)
echo $API_URL

# Test de salud (debe retornar 404 o error de ruta, confirmando que API funciona)
curl $API_URL
\`\`\`

### 7.2 Verificar Lambda Functions

\`\`\`bash
# Listar funciones
aws lambda list-functions \\
  --query 'Functions[?starts_with(FunctionName, `register-user`)].FunctionName' \\
  --profile inferno-bank
\`\`\`

### 7.3 Verificar DynamoDB Tables

\`\`\`bash
# Listar tablas
aws dynamodb list-tables --profile inferno-bank
\`\`\`

### 7.4 Verificar SQS Queues

\`\`\`bash
# Listar queues
aws sqs list-queues --profile inferno-bank
\`\`\`

## Paso 8: Pruebas Iniciales

### 8.1 Registrar Usuario

\`\`\`bash
API_URL=$(terraform output -raw api_url)

curl -X POST $API_URL/register \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "password": "password123",
    "document": "1234567890"
  }'
\`\`\`

Respuesta esperada:

\`\`\`json
{
  "uuid": "...",
  "name": "Test",
  "lastName": "User",
  "email": "test@example.com",
  "document": "1234567890"
}
\`\`\`

### 8.2 Verificar Logs

\`\`\`bash
# Ver logs de registro
aws logs tail /aws/lambda/register-user-lambda-dev \\
  --follow \\
  --profile inferno-bank
\`\`\`

### 8.3 Verificar Creación de Tarjetas

Las tarjetas se crean de forma asíncrona vía SQS. Esperar 10-30 segundos y verificar:

\`\`\`bash
# Ver logs del worker
aws logs tail /aws/lambda/card-approval-worker-dev \\
  --since 5m \\
  --profile inferno-bank
\`\`\`

## Actualizar Servicios

Cuando se modifica el código:

\`\`\`bash
# 1. Reconstruir servicio
cd services/user-service
npm run build

# 2. Aplicar cambios
cd ../../infra
terraform apply
\`\`\`

Terraform detecta el cambio en el zip y actualiza las Lambdas automáticamente.

## Rollback

Si algo falla:

\`\`\`bash
# Ver historial de state
terraform state list

# Rollback a versión anterior (si usas versioning en S3)
terraform init -reconfigure

# O destruir y recrear
terraform destroy
terraform apply
\`\`\`

## Monitoreo Post-Despliegue

### CloudWatch Dashboard

Crear dashboard personalizado en CloudWatch para monitorear:

- Lambda invocations y errors
- API Gateway requests y latency
- DynamoDB consumed capacity
- SQS messages sent/received
- SES emails sent

### Alarmas Recomendadas

\`\`\`bash
# Ejemplo: Alarma de errores en Lambda
aws cloudwatch put-metric-alarm \\
  --alarm-name high-lambda-errors \\
  --alarm-description "High error rate in Lambda" \\
  --metric-name Errors \\
  --namespace AWS/Lambda \\
  --statistic Sum \\
  --period 300 \\
  --threshold 10 \\
  --comparison-operator GreaterThanThreshold \\
  --evaluation-periods 1 \\
  --profile inferno-bank
\`\`\`

## Costos Estimados

**Desarrollo (uso bajo):**
- DynamoDB: ~$5/mes (on-demand)
- Lambda: Gratuito (dentro de free tier)
- S3: ~$1/mes
- SQS: Gratuito (dentro de free tier)
- API Gateway: ~$3.50/millón de requests
- **Total: ~$10-15/mes**

**Producción (uso moderado):**
- Depende del tráfico
- Considerar Reserved Capacity para DynamoDB
- Evaluar Savings Plans para Lambda

## Troubleshooting Común

### Error: "Backend initialization required"

\`\`\`bash
terraform init -reconfigure
\`\`\`

### Error: "Access Denied" en S3

Verificar permisos del usuario IAM y políticas del bucket.

### Lambda timeout

Aumentar timeout en `infra/modules/lambda/main.tf`:

\`\`\`hcl
timeout = 60  # aumentar de 30 a 60 segundos
\`\`\`

### SES Sandbox Limitations

En sandbox, solo puedes enviar a emails verificados. Solicitar producción access.

## Siguiente Pasos

1. Configurar CI/CD pipeline (GitHub Actions, GitLab CI)
2. Implementar tests automatizados
3. Configurar monitoring avanzado
4. Implementar backup automatizado de DynamoDB
5. Configurar WAF para API Gateway (producción)
6. Implementar rate limiting
7. Configurar alertas de seguridad (AWS GuardDuty)

## Soporte

Para problemas de despliegue, revisar logs en CloudWatch:

\`\`\`bash
# Logs de Terraform
cat terraform.log

# Logs de Lambda
aws logs tail /aws/lambda/[function-name] --profile inferno-bank
\`\`\`
\`\`\`
