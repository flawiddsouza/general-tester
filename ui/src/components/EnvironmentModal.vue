<template>
    <modal title="Environment (JSON Format)" v-model="showModalComp" height="70vh" width="55rem" v-if="showModalComp">
        <template #after-title>
            <button type="button" class="button" @click="importEnvironment">
                <i class="fa fa-upload"></i> Import
            </button>
            <button type="button" class="button ml-1" @click="exportEnvironment">
                <i class="fa fa-download"></i> Export
            </button>
        </template>

        <div style="display: grid; grid-template-columns: auto 1fr; height: 100%; overflow: auto;">
            <div style="display: grid; grid-template-rows: auto 1fr; height: 100%; overflow: auto; margin-right: 1rem; border-right: 1px solid var(--border-color)">
                <button class="button" type="button" style="margin-bottom: 0.5rem; margin-right: 0.5rem;" @click="addEnvironment()">Add Environment</button>
                <div style="overflow-y: auto;" class="environment-sidebar">
                    <div v-for="environment in storeStore.environments" class="environment-sidebar-item" :class="{ 'environment-sidebar-item-active': environment.id === storeStore.selectedEnvironment.id }" @click="storeStore.changeEnvironment(environment.id)" :ref="'environment-' + environment.id">
                        <div>{{ environment.name }}</div>
                        <div class="environment-sidebar-item-menu" :class="{ 'environment-sidebar-item-menu-disable-hide': environment.id === clickedContextMenuEnvironment.id && showEnvironmentContextMenuPopup === true }" @click.stop="showEnvironmentContextMenu($event, environment)">
                            <svg viewBox="0 0 24 24" focusable="false" style="pointer-events: none; display: block; width: 100%; height: 100%;">
                                <g>
                                    <path d="M12,16.5c0.83,0,1.5,0.67,1.5,1.5s-0.67,1.5-1.5,1.5s-1.5-0.67-1.5-1.5S11.17,16.5,12,16.5z M10.5,12 c0,0.83,0.67,1.5,1.5,1.5s1.5-0.67,1.5-1.5s-0.67-1.5-1.5-1.5S10.5,11.17,10.5,12z M10.5,6c0,0.83,0.67,1.5,1.5,1.5 s1.5-0.67,1.5-1.5S12.83,4.5,12,4.5S10.5,5.17,10.5,6z" style="fill: var(--text-color);"></path>
                                </g>
                            </svg>
                        </div>
                    </div>
                </div>
            </div>
            <div style="display: grid; grid-template-rows: 1fr auto; overflow: auto;">
                <CodeMirrorEditor
                    v-model="environment"
                    lang="json"
                    :env-variables="envVariables"
                    style="overflow: auto;"
                    :key="storeStore.selectedEnvironment.id"
                ></CodeMirrorEditor>
                <div style="margin-top: 1rem">
                    <div v-if="parseError" class="box">{{ parseError }}</div>
                    <div class="box box-hidden" v-else>
                        Spacer Text
                    </div>
                </div>
            </div>
        </div>

        <template #footer>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="font-size: 0.75rem; text-align: left; line-height: 1rem; margin-right: 0.5rem;" v-pre><span class="code">"key": "value"</span> pairs defined in the above JSON object can be referenced in any text input in the nodes using <span class="code">{{ $env.key }}</span> for variable substitution</div>
                <div>
                    <button class="button" @click="done">Done</button>
                </div>
            </div>
        </template>
    </modal>
    <template v-if="showEnvironmentContextMenuPopup">
        <div class="context-menu-background-overlay" @click="hideEnvironmentContextMenu()"></div>
        <div class="context-menu" :style="{ top: showEnvironmentContextMenuPopupCoords.y, left: showEnvironmentContextMenuPopupCoords.x }">
            <div @click="renameEnvironment">Rename</div>
            <div @click="deleteEnvironment">Delete</div>
        </div>
    </template>
</template>

<script lang="ts">
// @ts-nocheck
import Modal from '@/components/Modal.vue'
import CodeMirrorEditor from '@/components/CodeMirrorEditor.vue'
import { nextTick } from 'vue'
import { mapStores } from 'pinia'
import { useStore } from '@/store'
import { nanoid } from 'nanoid/non-secure'

export default {
    props: {
        showModal: Boolean,
    },
    components: {
        Modal,
        CodeMirrorEditor
    },
    data() {
        return {
            environment: '{}',
            environmentToSave: {},
            parseError: '',
            clickedContextMenuEnvironment: { name: '' },
            showEnvironmentContextMenuPopup: false,
            showEnvironmentContextMenuPopupCoords: {
                x: '',
                y: ''
            },
            envVariables: {},
            blockSaveEnvironment: false,
        }
    },
    computed: {
        showModalComp: {
            get() {
                return this.showModal
            },
            set(value) {
                this.$emit('update:showModal', value)
            }
        },
        ...mapStores(useStore)
    },
    watch: {
        environment() {
            let environment = {}
            try {
                environment = JSON.parse(this.environment)
                this.parseError = ''
                this.environmentToSave = environment
                this.saveEnvironment()
            } catch(e) {
                this.parseError = e.message
            }
        },
        showModal() {
            if(this.showModal) {
                this.parseError = ''
                this.environment = JSON.stringify(this.storeStore.selectedEnvironment.env, null, 4)
                nextTick(() => {
                    this.$refs['environment-' + this.storeStore.selectedEnvironment.id][0].scrollIntoView({
                        behavior: 'auto',
                        block: 'center',
                        inline: 'center'
                    })
                })
            }
        },
        'storeStore.selectedEnvironment'() {
            this.blockSaveEnvironment = true
            this.environment = JSON.stringify(this.storeStore.selectedEnvironment.env, null, 4)
        }
    },
    methods: {
        async done() {
            this.showModalComp = false
        },
        async addEnvironment(newEnvironmentName = undefined, environmentObject = undefined) {
            const isImport = environmentObject !== undefined
            let isMerge = false

            if(newEnvironmentName === undefined) {
                newEnvironmentName = await window.createPrompt('Enter new environment name')

                if(!newEnvironmentName || newEnvironmentName.trim() === '') {
                    return
                }
            }

            if(this.storeStore.environments.some(environment => environment.name === newEnvironmentName)) {
                if(!isImport) {
                    this.$toast.error(`Given environment name already exists: ${newEnvironmentName}`)
                    return
                } else {
                    if(!await window.createConfirm(`Given environment name already exists: ${newEnvironmentName}\nDo you want to merge with the existing one?`)) {
                        return
                    }

                    isMerge = true
                }
            }

            let environment = { id: nanoid(), name: newEnvironmentName, env: {} }

            if(!isMerge) {
                if(environmentObject !== undefined) {
                    environment.env = environmentObject
                }

                await this.storeStore.createEnvironment(environment)
            } else {
                const existingEnvironment = this.storeStore.environments.find(environment => environment.name === newEnvironmentName)
                await this.storeStore.updateEnvironment(environment.id, { ...existingEnvironment.env, ...environmentObject })
            }

            nextTick(() => {
                this.$refs['environment-' + environment.id][0].scrollIntoView({
                    behavior: 'auto',
                    block: 'center',
                    inline: 'center'
                })
            })
        },
        showEnvironmentContextMenu(event, environment) {
            if(this.clickedContextMenuEnvironment.name === environment.name && this.showEnvironmentContextMenuPopup === true) {
                this.hideEnvironmentContextMenu()
                return
            }
            const menuElement = event.target
            var clientRect = menuElement.getBoundingClientRect()
            var clientX = clientRect.left
            var clientY = clientRect.top
            this.clickedContextMenuEnvironment = environment
            this.showEnvironmentContextMenuPopupCoords.x = clientX + 'px'
            this.showEnvironmentContextMenuPopupCoords.y = (clientY + clientRect.height + 5) + 'px'
            this.showEnvironmentContextMenuPopup = true
        },
        hideEnvironmentContextMenu(clearClickedContextMenuEnvironment = true) {
            if(this.showEnvironmentContextMenuPopup === false) {
                return
            }
            this.showEnvironmentContextMenuPopup = false
            if(clearClickedContextMenuEnvironment) {
                this.clickedContextMenuEnvironment = { name: '' }
            }
        },
        async saveEnvironment() {
            if(this.blockSaveEnvironment) {
                this.blockSaveEnvironment = false
                return
            }
            await this.storeStore.updateEnvironment(this.storeStore.selectedEnvironment.id, this.environmentToSave)
        },
        async renameEnvironment() {
            const newEnvironmentName = await window.createPrompt('Enter new environment name', this.clickedContextMenuEnvironment.name)

            if(!newEnvironmentName || newEnvironmentName.trim() === '') {
                this.hideEnvironmentContextMenu()
                return
            }

            if(this.clickedContextMenuEnvironment.name !== newEnvironmentName && this.storeStore.environments.some(environment => environment.name === newEnvironmentName)) {
                this.$toast.error('Given environment name already exists')
                this.hideEnvironmentContextMenu()
                return
            }

            await this.storeStore.renameEnvironment(this.clickedContextMenuEnvironment.id, newEnvironmentName)

            this.hideEnvironmentContextMenu()
        },
        async deleteEnvironment() {
            if(this.storeStore.environments.length === 1) {
                this.$toast.error('Cannot delete environment as there\'s only one environment left')
                this.hideEnvironmentContextMenu()
                return
            }

            if(!await window.createConfirm('Are you sure you want to delete this environment?')) {
                this.hideEnvironmentContextMenu()
                return
            }

            await this.storeStore.deleteEnvironment(this.clickedContextMenuEnvironment.id)

            this.hideEnvironmentContextMenu()
        },
        importEnvironment() {
            const fileInput = document.createElement('input')
            fileInput.type = 'file'
            fileInput.accept = '.json'
            fileInput.style.display = 'none'
            fileInput.addEventListener('change', async() => {
                const file = fileInput.files[0]
                if(!file) {
                    return
                }
                const fileContents = await file.text()
                try {
                    const parsedJSON = JSON.parse(fileContents)
                    let environment = {}

                    if('_postman_variable_scope' in parsedJSON && parsedJSON._postman_variable_scope === 'environment') {
                        parsedJSON.values.forEach(variable => {
                            if(variable.enabled) {
                                environment[variable.key] = variable.value
                            }
                        })
                    } else {
                        environment = parsedJSON.env
                    }

                    this.addEnvironment(parsedJSON.name, environment)
                } catch(e) {
                    this.$toast.error('Invalid JSON file')
                } finally {
                    document.body.removeChild(fileInput)
                }
            })
            document.body.appendChild(fileInput)
            fileInput.click()
        },
        exportEnvironment() {
            const environment = this.storeStore.environments.find(environment => environment.id === this.storeStore.selectedEnvironment.id)
            const blob = new Blob([JSON.stringify(environment, null, 4)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `${environment.name}.general_tester_environment.json`
            link.click()
        },
    },
}
</script>

<style scoped>
.box {
    padding: 0.6rem;
    border: 1px dotted #d04444;
    border-radius: 0.3rem;
}

.box-hidden {
    border: 1px dotted transparent;
    visibility: hidden;
}

.environment-sidebar-item {
    display: flex;
    padding-top: 0.3rem;
    padding-bottom: 0.3rem;
    padding-left: 0.3rem;
    padding-right: 0.3rem;
    cursor: pointer;
    justify-content: space-between;
    align-items: center;
}

.environment-sidebar-item-active {
    background-color: rgb(104 114 254 / 26%);
}

.environment-sidebar-item > .environment-sidebar-item-menu {
    visibility: hidden;
    border-radius: 10px;
    height: 1.4rem;
}

.environment-sidebar-item:hover > .environment-sidebar-item-menu,
.environment-sidebar-item > .environment-sidebar-item-menu.environment-sidebar-item-menu-disable-hide {
    visibility: visible;
}

.environment-sidebar-item.environment-sidebar-item-selected > .environment-sidebar-item-menu svg {
    fill: white;
}

.environment-sidebar-item > .environment-sidebar-item-menu:hover,
.environment-sidebar-item > .environment-sidebar-item-menu.environment-sidebar-item-menu-disable-hide {
    background-color: rgba(240, 248, 255, 0.233);
}

.environment-sidebar-item:not(.environment-sidebar-item-selected) > .environment-sidebar-item-menu:hover,
.environment-sidebar-item:not(.environment-sidebar-item-selected) > .environment-sidebar-item-menu.environment-sidebar-item-menu-disable-hide {
    background-color: rgb(108 194 197 / 20%);
}

.context-menu-background-overlay {
    position: fixed;
    z-index: 10;
    height: 100vh;
    width: 100vw;
    top: 0;
    left: 0;
}

.context-menu {
    position: fixed;
    z-index: 10;
    top: 0;
    left: 0;
    background-color: var(--background-color);
    color: var(--text-color);
    border-radius: 5px;
    box-shadow: 1px 1px 8px -4px black;
}

.context-menu > div {
    padding: 0.3rem 0.5rem;
    cursor: pointer;
}

.context-menu > div:hover {
    background-color: slateblue;
    color: white;
}

.ml-1rem {
    margin-left: 1rem;
}
</style>
