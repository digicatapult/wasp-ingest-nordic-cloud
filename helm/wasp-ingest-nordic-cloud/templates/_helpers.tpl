{{/*
Create name to be used with deployment.
*/}}
{{- define "wasp-ingest-nordic-cloud.fullname" -}}
    {{- if .Values.fullnameOverride -}}
        {{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
    {{- else -}}
      {{- $name := default .Chart.Name .Values.nameOverride -}}
      {{- if contains $name .Release.Name -}}
        {{- .Release.Name | trunc 63 | trimSuffix "-" -}}
      {{- else -}}
        {{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
      {{- end -}}
    {{- end -}}
{{- end -}}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "wasp-ingest-nordic-cloud.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "wasp-ingest-nordic-cloud.selectorLabels" -}}
app.kubernetes.io/name: {{ include "wasp-ingest-nordic-cloud.fullname" . }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "wasp-ingest-nordic-cloud.labels" -}}
helm.sh/chart: {{ include "wasp-ingest-nordic-cloud.chart" . }}
{{ include "wasp-ingest-nordic-cloud.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Conditionally populate imagePullSecrets if present in the context
*/}}
{{- define "wasp-ingest-nordic-cloud.imagePullSecrets" -}}
  {{- if (not (empty .Values.image.pullSecrets)) }}
imagePullSecrets:
    {{- range .Values.image.pullSecrets }}
  - name: {{ . }}
    {{- end }}
  {{- end }}
{{- end -}}

{{/*
Gets the things service name based on values
if the mock is enabled we'll allow the name to be set by the logic in the nginx chart
if the mock is disabled then just use the name provided in the init config
*/}}
{{- define "wasp-ingest-nordic-cloud.thing-service-name" -}}
  {{- if .Values.waspthingmock.enabled -}}
    {{- if .Values.waspthingmock.fullnameOverride -}}
      {{- .Values.waspthingmock.fullnameOverride | trunc 63 | trimSuffix "-" -}}
    {{- else -}}
      {{- $name := default "waspthingmock" .Values.waspthingmock.nameOverride -}}
      {{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
    {{- end -}}
  {{- else -}}
    {{- .Values.config.init.thingServiceName -}}
  {{- end -}}
{{- end -}}

{{/*
Conditionally populate initContainers
*/}}
{{- define "wasp-ingest-nordic-cloud.initContainers" }}
initContainers:
{{ $name := include "wasp-ingest-nordic-cloud.fullname" . }}
  - name: {{ printf "%s-wait-deps" $name | trunc 63 | trimSuffix "-" }}
    image: busybox:1.28
    command:
      - 'sh'
      - '-c'
      - 'until nslookup $THING_NAME.$(cat /var/run/secrets/kubernetes.io/serviceaccount/namespace).svc.cluster.local; do echo waiting for wasp-thing-service; sleep 2; done'
    env:
      - name: THING_NAME
        value: {{ include "wasp-ingest-nordic-cloud.thing-service-name" . }}
  - name: {{ printf "%s-register" $name | trunc 63 | trimSuffix "-" }}
    image: curlimages/curl:7.75.0
    command:
      - 'sh'
      - '-c'
      - 'echo "Asserting ingest $INGEST_NAME"; code=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Content-Type:application/json" http://$THING_NAME:$THINGS_PORT/v1/ingest -d "{ \"name\": \"$INGEST_NAME\" }"); echo "Assertion result: $code"; case $code in 201|409) exit 0 ;; *) exit 1 ;; esac;'
    env:
      - name: THING_NAME
        value: {{ include "wasp-ingest-nordic-cloud.thing-service-name" . }}
      - name: THINGS_PORT
        value: {{ .Values.config.init.thingServicePort | quote }}
      - name: INGEST_NAME
        value: {{ .Values.config.waspIngestName }}
{{ end -}}

{{/*
Create a default fully qualified mqtt-broker name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
*/}}
{{- define "wasp-ingest-nordic-cloud.mqttBroker.endpoint" -}}
{{- if .Values.config.nordicCloudMqttEndpoint -}}
{{ .Values.config.nordicCloudMqttEndpoint | trunc 63 | trimSuffix "-" -}}
{{- else if not ( .Values.mosquitto.enabled ) -}}
{{ fail "An MQTT broker must either be configured or a mosquitto instance enabled" }}
{{- else if .Values.mosquitto.fullnameOverride -}}
{{- printf "mqtt://%s:1883" .Values.mosquitto.fullnameOverride -}}
{{- else -}}
{{- $name := default "mosquitto" .Values.mosquitto.nameOverride -}}
{{- printf "mqtt://%s-%s:1883" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}

{{/*
Create a default fully qualified kafka broker name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
*/}}
{{- define "wasp-ingest-nordic-cloud.kafka.brokers" -}}
{{- if .Values.config.kafkaBrokers -}}
{{ .Values.config.kafkaBrokers | trunc 63 | trimSuffix "-" -}}
{{- else if not ( .Values.kafka.enabled ) -}}
{{ fail "Kafka brokers must either be configured or a kafka instance enabled" }}
{{- else if .Values.kafka.fullnameOverride -}}
{{- printf "%s:9092" .Values.kafka.fullnameOverride -}}
{{- else -}}
{{- $name := default "kafka" .Values.kafka.nameOverride -}}
{{- printf "%s-%s:9092" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}
