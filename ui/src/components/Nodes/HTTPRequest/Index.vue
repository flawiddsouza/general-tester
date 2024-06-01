<template>
    <Base :node="node">
        <div class="flex">
            <div>
                <label>
                    Method
                    <div>
                        <select v-model="node.data.method" class="input full-width">
                            <option value="GET">GET</option>
                            <option value="POST">POST</option>
                            <option value="PUT">PUT</option>
                            <option value="PATCH">PATCH</option>
                            <option value="DELETE">DELETE</option>
                        </select>
                    </div>
                </label>
            </div>
            <div class="full-width ml-1">
                <label>
                    URL
                    <div>
                        <TextInput v-model="node.data.url" />
                    </div>
                </label>
            </div>
        </div>
        <div class="mt-1">
            Headers
            <ParamsEditor :params="node.data.headers"></ParamsEditor>
        </div>
        <div class="mt-1">
            Query Parameters
            <ParamsEditor :params="node.data.queryParams"></ParamsEditor>
        </div>
        <div class="mt-1">
            <label>
                Body
                <div>
                    <select v-model="node.data.body.mimeType" class="input full-width mb-1" @change="bodyMimeTypeChanged($event.target.value)">
                        <option value="No Body">No Body</option>
                        <option value="application/x-www-form-urlencoded">Form URL Encoded</option>
                        <option value="application/json">JSON</option>
                    </select>
                </div>
            </label>
            <div v-if="node.data.body.mimeType === 'application/x-www-form-urlencoded'">
                <ParamsEditor :params="node.data.body.params"></ParamsEditor>
            </div>
            <div v-else-if="node.data.body.mimeType === 'application/json'">
                <textarea v-model="node.data.body.text" class="input full-width"></textarea>
            </div>
        </div>
        <div class="mt-1">
            <label>
                Output
                <div>
                    <textarea v-model="node.data.output" class="input full-width"></textarea>
                </div>
            </label>
        </div>
    </Base>
</template>

<script setup lang="ts">
import { HTTPRequestNode } from '@/global'
import Base from '@/components/Nodes/Base.vue'
import TextInput from '@/components/TextInput.vue'
import ParamsEditor from './ParamsEditor.vue'
import { constants } from '@/constants';

const props = defineProps<{ node: HTTPRequestNode }>()

function bodyMimeTypeChanged(newMimeType: string | null) {
    let mimeType = null

    if(newMimeType === constants.MIME_TYPE.FORM_URL_ENCODED) {
        mimeType = constants.MIME_TYPE.FORM_URL_ENCODED
    }

    if(newMimeType === constants.MIME_TYPE.JSON) {
        mimeType = constants.MIME_TYPE.JSON
    }

    if(mimeType === null) {
        for (let i = 0; i < props.node.data.headers.length; i++) {
            if (props.node.data.headers[i].name === 'Content-Type') {
                props.node.data.headers.splice(i, 1)
            }
        }
        return
    }

    let contentTypeHeader = 'headers' in props.node.data && props.node.data.headers.find(header => header.name.toLowerCase() === 'content-type')

    if(contentTypeHeader) {
        contentTypeHeader.value = mimeType
    } else {
        props.node.data.headers.push({
            name: 'Content-Type',
            value: mimeType,
            disabled: false,
        })
    }
}
</script>
